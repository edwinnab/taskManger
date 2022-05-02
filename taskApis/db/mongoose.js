//handles connection logic to the mongoDb database

const mongoose = require('mongoose')

mongoose.Promise = global.Promise //call on the JS promises as for mongoose version 4 it does not have promises of its own

mongoose.connect('mongodb://localhost:27017/TaskManager', {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Connected to database successfully!!")
}).catch( (e) => {
    console.log("Failed to connect to the database", e)
})


module.exports = {
    mongoose
}
