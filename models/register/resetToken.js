const mongoose = require('mongoose');

const resetTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    token: { type: String, required: true },
});

module.exports = mongoose.model('ResetToken', resetTokenSchema);