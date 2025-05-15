const mongoose = require('mongoose');

const callSchema = new mongoose.Schema(
    {
        callSid: { type: String, required: true, unique: true },
        from: { type: String, required: true },                 
        to: { type: String, required: true },
        status: { type: String, required: true },
        direction: { type: String },
        duration: { type: Number },
        answeredBy: { type: String },
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
    },
    {
        timestamps: true, // Adds createdAt and updatedAt fields
    }
);

const CallSchema  = mongoose.model('Call', callSchema);

module.exports = { CallSchema };
