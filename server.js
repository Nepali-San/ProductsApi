const mongoose = require('mongoose')

//for setting "nodejs env variables" from config.env file
//set it before app.js, app.js may need to use config informations.
const dotenv = require('dotenv')
dotenv.config({ path: './config.env' })

//app.js may use logging if NODE_ENV='development'
const app = require('./app')

//Replace password , only for database on cloud
const DB = process.env.DATABASE.replace('<PASSWORD>', process.env.PASSWORD)

mongoose.connect(DB, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
}).then(_ => console.log("Database connected"))
    .catch(err => console.error(err))

const PORT = process.env.PORT || 4000
const server = app.listen(PORT, () => console.log(`Server started on port ${PORT}`))

//similar to unhandlerejection, but for synchoronous code
//on printing undefined variable : console.log(x)
process.on('uncaughtException', err => {
    console.log(err.name, err.message)
    process.exit(1)
})

//on db connection or related errors
process.on('unhandledRejection', err => {
    console.log(err.name, err.message)
    console.log('unhandled rejection. shutting down')
    server.close(() => {
        //wait for server to complete it current process and then
        //exit the application, 1 for exception, 0 for success 
        process.exit(1)
    })
})
