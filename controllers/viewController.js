const Product = require('../models/productsModel')
const catchAsync = require("../utils/catchAsync")

exports.getOverview = catchAsync(async (req, res) => {
    const products = await Product.find();

    res.status(200).render('overview', {
        title: "Overview",
        products
    })
})

exports.getProduct = catchAsync(async (req, res) => {
    const product = await Product.findOne({ slug: req.params.slug }).populate({
        path: 'review',
        field: 'review rating user'
    })
    // res.json(product)
    res.status(200).render('product', {
        title: "Product",
        product
    })
})