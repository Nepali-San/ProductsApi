class ApiFeatures {

    constructor(query, queryString) {
        this.query = query
        this.queryString = queryString
    }

    filter() {
        //using queries for basic filtering,don't modify original queryString
        //as it is used by other methods so copy the object
        const queryObj = { ...this.queryString }

        //excluding listed features
        const excludeFields = ['page', 'sort', 'limit', 'fields']
        excludeFields.forEach(el => delete queryObj[el])

        //convert standard operation to mongodb operation : gte -> $gte
        let queryStr = JSON.stringify(queryObj)
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`)

        //update our query with filters
        this.query = this.query.find(JSON.parse(queryStr))        

        //return object for chaining support
        return this
    }

    sort() {
        //if queryString contains `sort`
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)
        } else {
            //by default we sort with created_at descending
            this.query = this.query.sort("-created_at")
        }
        return this
    }

    limitFields() {
        if (this.queryString.fields) {
            //remove the commas and separate by space
            const fields = this.queryString.fields.split(',').join(' ')
            //mongoose projection 
            this.query = this.query.select(fields)
        } else {
            //by default remove __v given by mongodb
            this.query = this.query.select('--__v')
        }
        return this
    }

    paginate() {
        //convert page & limit to number by multiplying with 1
        //page and limit has default value 1 & 10 resp.
        const page = this.queryString.page * 1 || 1
        const limit = this.queryString.limit * 1 || 10
        const skip = (page - 1) * limit

        this.query = this.query.skip(skip).limit(limit)
        return this
    }

}

module.exports = ApiFeatures