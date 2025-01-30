const mongoose = require('mongoose');

// Define a Mongoose schema for the user table
const userSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        name: { type: String, required: true },
        phone_no: { type: String, required: true, unique: true },
        vehical_no: { type: String, required: true, unique: true },
        password: { type: String, required: true },
        device_type: { type: String, required: true },
        token: { type: String, required: true }
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const User = mongoose.model('User', userSchema);

module.exports = { User };