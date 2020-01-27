const Review = require('../models/reviewModel')
const catchAsync = require('../utils/catchAsync')
const factory = require('./handlerFactory')

exports.getProductReviews = catchAsync(async (req, res, next) => {

    let filter = { product: req.params.productId }

    const review = await Review.find(filter)

    res.status(200).json({
        status: 'success',
        data: {
            review
        }
    })
})

//put the required param in req.body to be used on createOne factory function
exports.setProductUserId = (req, res, next) => {
    req.body.product = req.params.productId
    req.body.user = req.user.id
    next()
}

exports.createReview = factory.createOne(Review)

exports.deleteReview = factory.deleteOne(Review)

exports.updateReview = factory.updateOne(Review)