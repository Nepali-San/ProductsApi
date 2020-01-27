const mongoose = require('mongoose')
const slugify = require('slugify')  //to create a slug for apis

const productSchema = mongoose.Schema({
    title: {
        type: String,
        trim: true,
        required: [true, "products must hava a title/name"],
        unique: true,
        maxlength: [35, 'product title must be less than or equal to 35 characters'],
        minlength: [4, 'product title must be more than or equal to 4 characters'],
    },
    slug: String,
    above18: {
        type: Boolean,
        default: false,
    },
    ratingAverage: {
        type: Number,
        default: 1,
        min: [1.0, 'Rating must be above 0'],
        max: [5.0, 'Rating must be below 5']
    },
    ratingQuantity: {
        type: Number,
        default: 0,
    },
    discountPercent: {
        type: Number,
        default: 0,
        //custom validator example
        validate: {
            validator: (value) => {
                return value >= 0 && value <= 100
            },
            message: 'Discount percent ({VALUE}) is not correct'
        }
    },
    price: {
        type: Number,
        required: [true, "products must hava a price"],
    },
    imageCover: {
        type: String,
        default: "someimage.com"
    },
    images: [
        String
    ],
    description: {
        type: String,
        required: [true, 'A product must have a description'],
        trim: true,
    },
    created_by: {
        type: mongoose.Schema.ObjectId,  
        ref:'User'      
    },
    created_at: {
        type: Date,
        default: Date.now(),
        select: false
    },
    updated_at: {
        type: Date,
        select: false,
    },
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinate: [Number],
        address: String,
        description: String
    },
    locations: [{
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinate: [Number],
        address: String,
        description: String,
        day:Number,
    }]
}, {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
})

//virtual property are not saved in db, they are derived from other data in db
productSchema.virtual('discountedPrice').get(function () {
    var newPrice = (this.discount * this.price) / 100
    return this.price - newPrice
})

productSchema.virtual('review',{
    ref:'Review',
    foreignField:'product',
    localField:'_id'
})

//Mongoose Document Middleware
//runs before the .save() & .create() command
productSchema.pre('save', function (next) {
    //`this` is the current document before saving into db
    //add `slug` to our document
    // this.created_by = 'id'
    this.slug = slugify(this.title, { lower: true })
    next()
})

//query middleware
//using regex to apply this middleware for every query starting with find,(ex: findOne,...)
// productSchema.pre('find', function (next) {
productSchema.pre(/^find/, function (next) {
    //this.find({ above18: { $ne: true } })
    this.populate({ path: 'created_by', select:'-__v -passwordChangedAt -role'})
    next()
})

const Product = mongoose.model('Product', productSchema)

module.exports = Product