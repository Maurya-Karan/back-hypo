import mongoose from "mongoose";

const schema = new mongoose.Schema({
    email: String,
    password: String,
    username: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    dob: {
        type: Date,
        required: false
    },
    score: {
        type: Number,
        required: false
    },
    loss: {
        type: Number,
        required: false
    },
    gain: {
        type: Number,
        required: false
    },
    friends: {
        type: [String],
        required: false
    },
    photu: {
        type: String,
        required: false
    },
    refreshToken: {
        type: String,
        default: null,
    }
}, { timestamps: true });

export const User = mongoose.model('HUser', schema);