require('dotenv').config();

const bcrypt    = require("bcrypt");
const CryptoJS  = require('crypto-js');
const path      = require('path');
const secretKey = process.env.CRPYTO_SECREAT;

const responseHandler = (res, status, message, data) => {
    res.status(status).json({
        status: status,
        message: message,
        data: (data)? data: {}
    });
};

const passwordHandler = {
    generatePwd:  (password) => {
        return new Promise(( resolve, reject ) => {
            bcrypt.hash(password, 10, function(err, hash) {
                (err)? reject(err): resolve(hash);
            }); 
        })
    },
    comparePwd:  (password, hash) => {
        return new Promise(( resolve, reject ) => {
            bcrypt.compare(password, hash, function(err, result) {
                (err)? reject(err): resolve(result);
            });
        })
    }
};

const crptyoGenerator = {
    encryptPwd: (password) => {
        return new Promise((resolve, reject) => {
            try {
                let encrypted = CryptoJS.AES.encrypt(password.toString(), secretKey).toString();
                encrypted = encrypted.replace(/\//g, '_');
                resolve(encrypted);
            } catch (error) {
                reject(error);
            }
        });
    },
    decryptPwd: (encryptedPassword) => {
        return new Promise((resolve, reject) => {
            try {
                encryptedPassword = encryptedPassword.replace(/_/g, '/').replace(/-/g, '+'); 
                const bytes = CryptoJS.AES.decrypt(encryptedPassword, secretKey);
                const decrypted = bytes.toString(CryptoJS.enc.Utf8);
                if (!decrypted) {
                    throw new Error("Decryption failed: Output is empty");
                }
                resolve(decrypted);
            } catch (error) {
                reject(new Error("Decryption failed: " + error.message));
            }
        });
    }
};

const dataTableReponse        = (res, status, input, recordsTotal, recordsFiltered, data) => {
    let datatable             = {};
    datatable.status          = status
    datatable.draw            = input.draw;
    datatable.recordsTotal    = recordsTotal;
    datatable.recordsFiltered = recordsFiltered;
    datatable.data            = data;
    return res.send(datatable);  
};

const paginate                = (page,  numPerPage = 10) => {
    const skip = (page - 1) * numPerPage;
    return `${skip},${numPerPage}`;
};

const generateNumber          = () => {
    return Math.random().toString().substring(2, 11);
};

const getImagePath            = (img) => {
    return (img)? "image/"+path.extname(img).replace(".","") : "";
};

module.exports = {
    responseHandler,
    passwordHandler,
    crptyoGenerator,
    dataTableReponse,
    paginate,
    generateNumber,
    getImagePath
}