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
        let docData       = req.body;
        if (!docData.type) {
            return responseHandler(res, ServerError, "Document type is required");
        }
        console.log(`req.body====>>>`, req.body);
        console.log(`docData====>>>`, docData);
        if (req.files) {
            if ('front' in req.files) {
                storage(req.files.front, docData.type, 'front', uuid);
                docData.front = await getFileName(req.files.front, docData.type, 'front', uuid);
            }
            if ('back' in req.files) {
                storage(req.files.back, docData.type, 'back', uuid);
                docData.back  = await getFileName(req.files.back, docData.type, 'back', uuid);
            }
        }
        let result     = "";
        docData.status = 0;
        if (docData.type === "driving") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else if (docData.type === "rc") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else if (docData.type === "puc") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else if (docData.type === "insurance") {
            if ('id' in  req.body) {
                result = await Documents.findByIdAndUpdate(id, docData, { new: true });
            } else {
                const docs = new Documents(docData);
                result     = await docs.save();
            }
        } else if (docData.type === "service") {
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