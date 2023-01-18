const mongoose = require('mongoose')

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, `[Title] must provide`],
        trim: true
    },
    description: {
        type: String,
        required: [true, `[Description] must provide`],
        trim: true
    },
    priority: {
        type: String,
        required: [true, `[Priority] must provide`],
        trim: true,
        enum: ["normal", "high", "low"],
        default: "normal"
    },
    is_completed: {
        type: Boolean,
        default: false
    },
    
})

const UsersSchema = new mongoose.Schema({
    fname: {
        type: String,
        required: [true, `[First Name] must provide`],
        trim: true,
        maxlength: [20, `[First Name] can not be more than 20 characters`]
    },
    lname: {
        type: String,
        required: [true, `[Last Name] must provide`],
        trim: true,
        maxlength: [20, `[Last Name] can not be more than 20 characters`]
    },
    email: {
        type: String,
        required: [true, `[Email] must provide`],
        trim: true,
        maxlength: [40, `[Email] can not be more than 40 characters`],
        unique: true
    },
    pass: {
        type: String,
        required: [true, `[Password] must provide`],
        trim: true,
        maxlength: [1000, `[Password] can not be more than 1000 characters`]
    },
    role: {
        type: String,
        enum: ["user", "admin"],
        default: "user"
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    verified: {
        type: Boolean,
        default: false
    },
    verifyMeta: {
        otp: {
            type: String,
            default: "000000"
        },
        issued_at: {
            type: Date,
            default: Date.now
        },
        used_for: {
            type: String,
            enum: ['verify-email', 'reset-password'],
            default: ''
        },
        previously_used_for: {
            type: String,
            enum: ['verify-email', 'reset-password'],
            default: ''
        }
    },
    tasks: [TaskSchema]
})

module.exports = mongoose.model('Users', UsersSchema)