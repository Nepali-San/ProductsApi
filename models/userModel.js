const mongoose = require('mongoose')
const validator = require('validator')
const bcrypt = require('bcryptjs')
const crypto = require('crypto')

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "You must have a name"],
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        unique: [true, 'Email already used'],
        lowercase: true,
        validate: [validator.isEmail, 'please provide a valid email'],
    },
    image: String,
    dob: {
        type: Date,
        required: [true, "Please provide your date of birth"],
    },
    password: {
        type: String,
        required: [true, 'Please provide a password'],
        minlength: [8, 'password must be of atleast 8 characters'],
        select: false, //don't send as response
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please confirm your password'],
        validate: {
            validator: function (value) {
                return this.password === value
            },
            message: "Password are not same"
        }
    },
    passwordChangedAt: Date,
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false,
    },
    updated_at: {
        type: Date,
        select: false,
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        address: String,
    },
}, {
    toJSON: { virtuals: false },
    toObject: { virtuals: true }
})

userSchema.index({ 'location.coordinate': '2dsphere' })

//virtual property are not saved in db, they are derived from other data in db
userSchema.virtual('age').get(function () {
    const age = (new Date() - new Date(this.dob)) / (1000 * 60 * 60 * 24 * 365.25)
    return age
})

userSchema.pre('save', async function (next) {
    //don't run if password is not modified, ex: when updating other user's data
    if (!this.isModified('password')) return next()

    //increase the cost to make it more secure,alternative to salting
    this.password = await bcrypt.hash(this.password, 8)
    //remove passwordConfirm
    this.passwordConfirm = undefined
    next()
})

userSchema.pre('save', async function (next) {
    //skip newly created documents/users 
    if (!this.isModified('password') || this.isNew) return next()

    //updating this field may sometime be late than getting JWT token,
    this.passwordChangedAt = Date.now()
    next()
})

userSchema.pre(/^find/, async function (next) {
    this.find({ active: { $ne: false } })
    next()
})

//instance method, available on all user documents
//compare login password with db password
userSchema.methods.correctPassword = async function (candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword)
}

userSchema.methods.changedPasswordAfter = function (JWTTimeStamp) {

    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000)
        return JWTTimeStamp < changedTimestamp
    }

    return false

}

userSchema.methods.createPasswordResetToken = function () {
    const resetToken = crypto.randomBytes(32).toString('hex')
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

    //convert 10 min to seconds and seconds to milliseconds    
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000

    return resetToken

}

const userModel = mongoose.model('User', userSchema)

module.exports = userModel