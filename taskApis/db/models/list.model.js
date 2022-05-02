/*
create our models --same as tables in relational databases
 */

const mongoose = require('mongoose')

const ListSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minLength: 1,
        trim: true //removes the whitespaces at the start and end of a string
    }
});

//create the model
const List = mongoose.model('List', ListSchema);

module.exports = { List }