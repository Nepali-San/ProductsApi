const express = require('express')
const path = require('path')
const usersRouter = require('./routes/api/users')
const productsRouter = require('./routes/api/products')
const reviewsRouter = require('./routes/api/reviews')
const morgan = require('morgan')    //for logging the requests on console
const ApiError = require('./utils/apiError')
const globalErrorHandler = require('./controllers/errorController')
const rateLimit = require('express-rate-limit')
const helmet = require('helmet')
const mongoSanitize = require('express-mongo-sanitize')
const xss = require('xss-clean')

const app = express()

// view engine setup for server-side rendering
// app.engine('handlebars', exphbs({ defaultLayout: 'main' }));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, "views"))

app.use(express.static(path.join(__dirname, 'public')))

app.use(helmet())
app.use(express.json({ limit: "10kb" }))
app.use(express.urlencoded({ extended: false }))

if (process.env.NODE_ENV === 'development') {
    //use logger only in development environment
    app.use(morgan('dev'))
}

const limiter = rateLimit({
    max: 150,
    windowM: 60 * 60 * 1000,
    message: "Too many request from this IP please try again in an hour"
})

app.use('/api', limiter)

app.use(mongoSanitize())
app.use(xss())

app.get('/', (req, res, next) => {
    res.status(200).render('base', {
        title: 'SToC',        
    })
})

app.use('/api/v1/users', usersRouter)
app.use('/api/v1/products', productsRouter)
app.use('/api/v1/reviews', reviewsRouter)


//for handling unknown routes
app.all('*', (req, res, next) => {
    const errMsg = `Can't find ${req.originalUrl} on this server !`

    //passing anything to next is treated as error
    //and is directed to ErrorHandling middleware

    next(new ApiError(errMsg, 404))
})

//Error handling middleware
app.use(globalErrorHandler)

module.exports = app