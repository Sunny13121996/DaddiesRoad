const express  = require('express');
const router   = express.Router();
const Auth     = require("../services/Auth");
const Notifications = require("../services/Notifications");
const { isAuthenticated } = require("../middleware/authenticateJWT");
const path    = require('path');
const multer  = require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, `../public/uploads/${file.fieldname}`));
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const upload   = multer({ storage: storage });
const cpUpload = upload.fields([{ name: 'image', maxCount: 1 }]);

// Auth Routes
router.post('/login', Auth.login);
router.post('/register', Auth.register);
router.post('/refreshToken', Auth.refreshToken);
router.post('/update-config', isAuthenticated, Auth.updateConfig);
router.post('/notifications', isAuthenticated, Notifications.notifications);

module.exports = router;
