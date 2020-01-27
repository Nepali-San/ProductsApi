const ApiError = require('../utils/apiError')
const catchAsync = require('../utils/catchAsync')

exports.deleteOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.findByIdAndDelete(req.params.id)

    if (!doc) throw new ApiError("No document found with that Id", 404)

    res.status(204).json({
        status: 'success',
        data: null,
    })
})

exports.updateOne = Model => catchAsync(async (req, res, next) => {
    const updatedItem = {
        ...req.body,
        updated_at: Date.now(),
    }

    const doc = await Model.findByIdAndUpdate(req.params.id, updatedItem, {
        new: true,
        runValidators: true,
    })

    if (!doc) throw new ApiError("No document found with that Id", 404)

    res.json({
        status: 'success',
        results: doc.length,
        data: doc
    })
})

exports.createOne = Model => catchAsync(async (req, res, next) => {

    const doc = await Model.create(req.body)

    return res.json({
        status: 'success',
        results: doc.length,
        data: doc,
    })

})