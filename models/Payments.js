const mongoose = require('mongoose');

// Define a Mongoose schema for the user table
const paymentsSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        uuid: { type: String, required: true },
        order_id: { type: String, required: true, unique: true },
        amount: { type: String, required: true },
        amount_paid: { type: String, required: true },
        amount_due: { type: String, required: true },
        currency: { type: String, required: true },
    },
    {
        timestamps: true, // Automatically adds createdAt and updatedAt fields
    }
);

const Payments = mongoose.model('Payments', paymentsSchema);

module.exports = { Payments };