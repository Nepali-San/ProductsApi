const Product = require('./productsModel')
const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
    review: {
        type: String,
        required: [true, 'Review cannot be empty']
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    product: {
        type: mongoose.Schema.ObjectId,
        ref: 'Product',
        required: [true, 'Review must belong to a product.']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: [true, 'Review must belong to a user.']
    },
    updated_at: {
        type: Date,
        select: false,
    }
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
})

reviewSchema.index({ product: 1, user: 1 }, { unique: true })

reviewSchema.pre(/^find/, function (next) {
    this.populate({ path: 'user', select: 'name image' })
    next()
})

//static methods, called on Model
reviewSchema.statics.calcAverageRatings = async function (productId) {
    //for static method, this = Model
    //aggregate method is called on model not on documents
    const stats = await this.aggregate([
        { $match: { product: productId } },
        {
            $group: {
                _id: '$product',
                nRating: { $sum: 1 },
                avgRating: { $avg: '$rating' }
            }
        }
    ])
    // console.log(stats)
    if (stats.length > 0) {
        await Product.findByIdAndUpdate(productId, {
            ratingQuantity: stats[0].nRating,
            ratingAverage: stats[0].avgRating
        })
    } else {
        //if all rating are deleted, go to default values
        await Product.findByIdAndUpdate(productId, {
            ratingQuantity: 0,
            ratingAverage: 1
        })
    }
}

reviewSchema.post('save', function () {
    // Model('Review') is not yet defined, so use 'this.constructor' instead of 'Review'
    //`this` is the instance of model
    this.constructor.calcAverageRatings(this.product)
})

//update products rating when updating and deleting the review
reviewSchema.pre(/^findOneAnd/, async function (next) {
    this.r = await this.findOne()
    //put all the information on the `this` so that it can be accessed on post middleware
    next()
})

reviewSchema.post(/^findOneAnd/, async function () {
    //call the static middleware
    await this.r.constructor.calcAverageRatings(this.r.product)
})

//Define the Model(`Review`) using schema
const Review = mongoose.model('Review', reviewSchema)

module.exports = Review