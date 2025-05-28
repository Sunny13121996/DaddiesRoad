const express  = require('express');
const router   = express.Router();
const Auth     = require("../services/Auth");
const Payments = require("../services/Payments");
const Documents = require("../services/Documents");
const Notifications = require("../services/Notifications");
const Twillio  = require("../services/Twillio");
const { isAuthenticated } = require("../middleware/authenticateJWT");

// Auth Routes
router.post('/login', Auth.login);
router.post('/register', Auth.register);
router.post('/refreshToken', Auth.refreshToken);
router.post('/updateConfig', Auth.updateConfig);
router.post('/updateProfile',  isAuthenticated, Auth.updateProfile);
router.post('/deleteAccount',  isAuthenticated, Auth.deleteAccount);
router.get('/qr/:uuid', Auth.qr);

// Payments
router.post('/createOrder', isAuthenticated, Payments.createOrder);
router.post('/verifyPayment', isAuthenticated, Payments.verifyPayment);

// Notifications
router.post('/notifications', Notifications.notifications);

// Twillio Calls
router.post('/voice', Twillio.voice);
router.post('/callFallBack', Twillio.callFallback);
router.post('/callBackStatus', Twillio.callBackStatus);
router.post('/inBoundCall', isAuthenticated, Twillio.inBoundCall);
router.post('/sendMessage', isAuthenticated, Twillio.sendMessage);
router.get('/token', isAuthenticated, Twillio.token);
router.get('/callStatus',  isAuthenticated, Twillio.callStatus);
router.post('/deductedFromWallet',  isAuthenticated, Twillio.deductedFromWallet);

// Documents
router.post('/createDocument', Documents.createDocuements);

module.exports = router;
