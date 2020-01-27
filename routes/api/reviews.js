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
        authController.restrictTo('user'),  //only users can create review
        reviewController.setProductUserId,  //set the product and user id on review data
        reviewController.createReview)

router.route('/:id')
    .delete(
        authController.authorize,           //be either admin or owner of the review
        reviewController.deleteReview)
    .patch(
        authController.restrictTo('user'),  //only users are allowed,no admins
        authController.authorize,           //user must be owner of the review
        reviewController.updateReview)

module.exports = router