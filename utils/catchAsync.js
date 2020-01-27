module.exports = catchAsync = func => {
    //it takes the function and appends a catch and return it wrapping with anonymous function...
    //we wrap with extra anony. func. so that we don't execute it directly
    // catchAynsc() will execute automatically and then
    // func(req,res,next) will also execute automatically
    // to prevent this we wrap with anony. func and return it 
    return (req, res, next) => {
        //if error happens , we send error to next        
        func(req, res, next).catch(error => next(error))
    }
}