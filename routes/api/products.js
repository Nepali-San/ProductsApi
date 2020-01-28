const express = require('express')
const router = express.Router()
const productsController = require('../../controllers/productsController')
const authController = require('../../controllers/authController')
const reviewRouter = require('./reviews')

//POST /api/v1/products/productId/reviews
//GET /api/v1/products/productId/reviews
router.use('/:productId/reviews', reviewRouter)

router.use(authController.protect)

router.route('/top-5-products')
    .get(
        productsController.topProducts,
        productsController.getProducts)

router.route('/product-stats').get(
    productsController.getProductStat)

router.route('/')
    .get(
        productsController.getProducts)
    .post(
        authController.restrictTo('user'),
        productsController.createProduct)

router.route('/:id')
    .get(
        productsController.getSingleProduct)
    .patch(
        authController.restrictTo('user'),
        authController.authorize, //owner is authorized
        productsController.updateProduct)
    .delete(
        authController.authorize,
        productsController.deleteProduct)

module.exports = router