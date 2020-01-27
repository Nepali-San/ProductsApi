const ApiError = require('../utils/apiError')

const handleCastErrorDB = error => {
    const msg = `Invalid ${error.path} : ${error.value}.`
    return new ApiError(msg, 400)
}

const handleDuplicateFieldsErrorDB = error => {
    const value = error.errmsg.match(/(["'])(\\?.)*?\1/)[0]
    const msg = `${value} is already used, please use another one.`
    return new ApiError(msg, 400)
}

const handleValidationErrorDB = error => {
    const errors = Object.values(error.errors).map(el => el.message)
    const msg = `Invalid input data: ${errors.join('. ')}`
    return new ApiError(msg, 400)
}

const handleJWTError = _ => new ApiError('Invalid token,please log in again', 401)

const handleJWTExpirationError = _ => new ApiError('Token expired,please log in again', 401)

const sendDevError = (err, res) => {

    res.status(err.statusCode).json({
        status: err.status,
        message: err.message,
        error: err,
        stack: err.stack
    })

}

const sendProdError = (err, res) => {

    if (err.isOperational) {
        //for handled errors
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message,
        })
    } else {
        //for unhandled error        
        console.error('Error : ', err)

        res.status(err.statusCode).json({
            status: "error",
            message: "Something went wrong"
        })
    }
}

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500
    err.status = err.status || 'error'

    if (process.env.NODE_ENV == 'development') {
        sendDevError(err, res)
    } else if (process.env.NODE_ENV == 'production') {

        //error may be handled err or unhandled err (err.isOperational set to false)
        let prodErr = { ...err };

        //handle some of the unhandled DB error i.e. convert to ApiError()
        if (err.name === 'CastError')
            prodErr = handleCastErrorDB(err)
        if (err.code === 11000)
            prodErr = handleDuplicateFieldsErrorDB(err)
        if (err.name === 'ValidationError')
            prodErr = handleValidationErrorDB(err)
        if (err.name === 'JsonWebTokenError')
            prodErr = handleJWTError()
        if (err.name === 'TokenExpiredError')
            prodErr = handleJWTExpirationError()

        sendProdError(prodErr, res)
    }

}