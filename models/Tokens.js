const mongoose = require('mongoose')

const TokensSchema = new mongoose.Schema({
    refreshToken: {
        type: String,
        required: [true, `"refreshToken" must required.`],
        trim: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    accessed_at: {
        type: Date,
        default: Date.now
    }
})

module.exports = mongoose.model('Tokens', TokensSchema)