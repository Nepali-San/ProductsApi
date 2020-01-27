const Product = require('../models/productsModel')
const ApiFeatures = require('./../utils/apiFeatures')
const catchAsync = require('../utils/catchAsync')
const ApiError = require('../utils/apiError')
const factory = require('./handlerFactory')

exports.topProducts = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingAverage,price'
    req.query.fields = 'title,price,ratingAverage,description,imageCover'
    next()
}

//catchAsync is being called (as `()` is used) , so it should return 
//a function which is called when getProducts is called
exports.getProducts = catchAsync(async (req, res, next) => {
    const dbquery = Product.find()
    const queryString = req.query

    const features = new ApiFeatures(dbquery, queryString)
        .filter()
        .sort()
        .limitFields()
        .paginate()

    if (req.user.age < 18)
        features.query = features.query.find({ above18: { $ne: true } })

    const products = await features.query

    res.status(200).json({
        status: 'success',
        results: products.length,
        data: {
            products
        }
    })
})

exports.getSingleProduct = catchAsync(async (req, res, next) => {
    const product = await Product.findById(req.params.id).populate('review')

    if (!product) {
        throw new ApiError('No product found with that id', 404)
    }

    if (product.above18 && req.user.age < 18) {
        throw new ApiError("Restricted content", 403)
    }

    res.status(200).json({
        status: 'success',
        results: product.length,
        data: {
            product
        }
    })
})

exports.getProductStat = catchAsync(async (req, res, next) => {

    const stats = await Product.aggregate([
        {
            //select the data
            $match: { ratingAverage: { $gte: 3 } }
        },
        {
            //group the data
            $group: {
                _id: "$created_by", //group-by , null if no group-by
                numberOfProducts: { $sum: 1 },
                averageRating: { $avg: '$ratingAverage' },
                avgPrice: { $avg: '$price' },
                minPrice: { $min: '$price' },
                maxPrice: { $max: '$price' },
            },
        },
        {
            //sort the data
            $sort: {
                numberOfProducts: -1 //1 for ascending order ,-1 for descending
            }
        },
        // {
        //     //again select the refined data
        //     $match: {
        //         _id: { $ne: 'Hari' }
        //     }
        // }
        //can chain/pipeline more operations / remove some of them

    ])

    if (!stats) {
        throw new ApiError('Stat not found', 404)
    }

    res.status(200).json({
        status: 'success',
        data: {
            stats
        }
    })

})

exports.createProduct = factory.createOne(Product)

exports.updateProduct = factory.updateOne(Product)

exports.deleteProduct = factory.deleteOne(Product)
