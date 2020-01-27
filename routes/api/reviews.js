const express = require('express')
const authController = require('../../controllers/authController')
const reviewController = require('../../controllers/reviewController')

//get route parameter from other router(products router),used for nested routes
const router = express.Router({ mergeParams: true })

router.use(authController.protect)

router.route('/')
    .get(
        reviewController.getProductReviews)
    .post(
        reviewController.setProductUserId,
        reviewController.createReview)

router.route('/:id')
    .delete(        
        reviewController.deleteReview)
    .patch(
        authController.restrictTo('user'),  //only users are allowed,no admins
        authController.authorize,           //user must be owner of the review
        reviewController.updateReview)

module.exports = router