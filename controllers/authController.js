const { promisify } = require('util')
const User = require('../models/userModel')
const Product = require('../models/productsModel')
const catchAsync = require('../utils/catchAsync')
const jwt = require('jsonwebtoken')
const ApiError = require('../utils/apiError')
const sendEmail = require('../utils/email')
const crypto = require('crypto')

const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_KEY, {
        expiresIn: process.env.JWT_EXPIRES_IN
    })
}

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id)
    let cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }

    if (process.env.NODE_ENV === 'production') cookieOptions.secure = true

    res.cookie('jwt', token, cookieOptions)

    user.password = undefined

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    })
}

exports.signup = catchAsync(async (req, res, next) => {

    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role,
        dob: req.body.dob,
    })

    createSendToken(newUser, 201, res)

})

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body

    //check if email and password exists
    if (!email || !password) {
        throw new ApiError("Please provide email & password", 400)
    }

    //check if the user exists & password is correct
    //since password `select` is false in schema, we explicity include it 
    const user = await User.findOne({ email }).select('+password')

    //user may not exists i.e. null so we check if user exists then only check password
    if (!user || !(await user.correctPassword(password, user.password))) {
        throw new ApiError("Incorrect email or password", 401)
    }

    //Send token
    createSendToken(user, 200, res)
})

exports.protect = catchAsync(async (req, res, next) => {

    let token;
    //Get token if it exists
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1]
    } else {
        throw new ApiError('You are not logged in', 401)
    }

    //verify the token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_KEY)

    //check if user exits
    const user = await User.findById(decoded.id)
    if (!user) throw new ApiError('User no longer exists', 401)

    //check if user change password after token was issued
    //discard all token issued before pwd change
    if (user.changedPasswordAfter(decoded.iat)) {
        throw new ApiError('User recently changed password, please login again', 401)
    }

    //put userdata in req , user is needed to get role in authorize function 
    req.user = user

    //grant access to protected route
    next()
})


exports.authorize = catchAsync(async (req, res, next) => {

    //`id` may refer to review id incase of nested routes
    const productId = req.params.productId ? req.params.productId : req.params.id

    const productToModify = await Product.findById(productId)

    if (!productToModify) {
        throw new ApiError('product not found', 404)
    }

    //if admin, authorize
    if (req.user.role === 'admin') {
        return next()
    }

    //if user, check if requesting user owns the product       
    if (productToModify.created_by.id != req.user._id) {
        throw new ApiError("You can't modify this product", 403)
    }

    next()
})

exports.restrictTo = (...roles) => catchAsync(async (req, res, next) => {

    //if admin, authorize
    if (roles.includes(req.user.role)) {
        return next()
    }

    throw new ApiError("Unauthorized access !!!", 403)

})


exports.forgotPassword = catchAsync(async (req, res, next) => {
    //Get users based on email
    const user = await User.findOne({ email: req.body.email })
    if (!user) {
        throw new ApiError('No user with that email address.', 404)
    }

    //generate random token
    const resetToken = user.createPasswordResetToken()
    await user.save({ validateBeforeSave: false })

    const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/reset-password/${resetToken}`
    const message = `Forgot your password ? Create new password at : ${resetURL}\n If you didn't forget your password , ignore this email`

    try {
        await sendEmail({
            email: user.email,
            subject: "your password reset token(valid for 10 min)",
            message
        })

        res.status(200).json({
            status: 'success',
            message: 'token send to the email'
        })
    } catch (error) {
        user.passwordResetToken = undefined
        user.passwordResetExpires = undefined
        await user.save({ validateBeforeSave: false })

        throw new ApiError('There was an error sending the email. Try again later.', 500)
    }
})

exports.resetPassword = catchAsync(async (req, res, next) => {
    //get user based on the token
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex')

    //if token not expired,set the new password
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    })

    if (!user) {
        throw new ApiError('Token has expired or invalid', 400)
    }

    user.password = req.body.password
    user.passwordConfirm = req.body.passwordConfirm
    user.passwordResetExpires = undefined
    user.passwordResetToken = undefined

    await user.save()

    //update changePasswordAt property for the user

    //login the user
    const token = signToken(user._id)

    res.status(201).json({
        status: 'success',
        token,
    })

})

