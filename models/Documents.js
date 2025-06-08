const mongoose = require('mongoose');

const docSchema = new mongoose.Schema(
    {
        _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
        name: { type: String, required: false },    
        number: { type: String, required: false },
        vaild_from: { type: Date, required: false },
        vaild_till: { type: Date, required: false },
        front: { type: String, required: false, default: "" },
        back: { type: String, required: false, default: "" },
        type: { type: String, required: false },
        status: { type: Number, default: 0, required: false },
        uuid: { type: String, required: true },
    },
    {
        timestamps: true,
    }
);

const Documents  = mongoose.model('Documents', docSchema);

module.exports = { Documents };
