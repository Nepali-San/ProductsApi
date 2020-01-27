//Inheriting Error class with some extra properties
class ApiErrors extends Error {

    constructor(message, statusCode) {
        super(message)

        this.statusCode = statusCode
        this.status = `${statusCode}`.startsWith(4) ? 'Failed' : 'error'

        //every know error(ApiErrors) set by developer is true.
        this.isOperational = true

        Error.captureStackTrace(this, this.constructor)
    }
}

module.exports = ApiErrors