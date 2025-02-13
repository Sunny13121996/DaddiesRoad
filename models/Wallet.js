const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        uuid: { type: String, required: true },
        balance: { type: Number, default: 0 }
    },
    {
        timestamps: true,
    }
);

const Wallet = mongoose.model('Wallet', walletSchema);

module.exports = { Wallet };