const User = require('./../models/userModel')
const ApiError = require('../utils/apiError')
const factory = require('./handlerFactory')

exports.getusers = catchAsync(async (req, res, next) => {
    const users = await User.find()

    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    })
})

exports.updateMe = catchAsync(async (req, res, next) => {
    if (req.body.password || req.body.passwordConfirm) {
        throw new ApiError("this route is not for password update", 400)
    }

    //filter not allowed fields from body
    const allowedFields = ['name', 'email']
    const filteredObj = {}
    Object.keys(req.body).forEach(el => {
        if (allowedFields.includes(el)) filteredObj[el] = req.body[el]
    })

    //update user
    const user = await User.findByIdAndUpdate(req.user._id, filteredObj, {
        new: true,
        runValidators: true,
    })

    res.status(200).json({
        status: "success",
        date: {
            user
        }
    })
})

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false })
    res.status(204).json({
        status: "success",
        data: null,
    })
})

exports.getMe = catchAsync(async (req, res, next) => {
   req.params.id = req.user._id
   next()    
})

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await User.findById(req.params.id)

    if (!user) throw new ApiError("No user found with that Id", 404)

    res.status(200).json({
        status: "success",
        data: user,
    })
})

exports.deleteUser = factory.deleteOne(User)

exports.updateUser = factory.updateOne(User)