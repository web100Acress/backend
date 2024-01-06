const mongoose = require('mongoose')

const contact_Schema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    mobile: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },

}
    , { timestamps: true }
)

const contactModel = mongoose.model('customerContact', contact_Schema)
module.exports = contactModel