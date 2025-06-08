require('dotenv').config();

const { responseHandler, passwordHandler } = require("../helper/helper");
const Razorpay            = require("razorpay");
const crypto              = require("crypto");
const Document            = {};
const {Documents}         = require("../models/Documents");
const {storage, getFileName} = require("../helper/uploadFileUpload")

const {
    OK,
    ServerError,
    NotFound,
    NotAcceptable,
    Unauthorized
}                         = require("../config/statusCodes");

Document.createDocuements = async (req, res) => {
    try {
        const { 
            name, 
            number, 
            vaild_till,
            front, 
            back, 
            type,
            uuid,
            id 
        }                 = req.body;
        if (!type) {
            return responseHandler(res, ServerError, "Document type is required");
        }
        const docData  = { name, number, vaild_till, type, uuid };
        if (req.files) {
            if ('front' in req.files) {
                storage(req.files.front, type, 'front', uuid);
                docData.front = await getFileName(req.files.front, type, 'front', uuid);
            }
            if ('back' in req.files) {
                storage(req.files.back, type, 'back', uuid);
                docData.back  = await getFileName(req.files.back, type, 'back', uuid);
            }
        }
        let result     = "";
        docData.status = 0;
        if (type === "driving") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else if (type === "rc") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else if (type === "puc") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else if (type === "insurance") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else if (type === "service") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else {
            return responseHandler(res, ServerError, "Invalid document type");
        }
        return responseHandler(res, OK, "Document processed successfully", result);
    } catch (error) {
        console.log(`err??`,error)
        return responseHandler(res, ServerError, error.message);
    }
};

module.exports = Document;