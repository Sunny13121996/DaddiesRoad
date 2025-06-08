require('dotenv').config();

const { responseHandler, passwordHandler } = require("../helper/helper");
const {User}              = require("../models/User");
const {Wallet}            = require("../models/Wallet");
const {Payments}          = require("../models/Payments");
const {Documents}         = require("../models/Documents");
const {Notification}      = require('../models/Notification');
const Auth                = {};
const jwtKey              = process.env.JWT_TOKEN;
const jwtAccessKey        = process.env.JWT_ACCESS_TOKEN;
const jwt                 = require("jsonwebtoken");
const { verifyRefresh }   = require("../middleware/authenticateJWT");
const { v4: uuidv4 }      = require('uuid');
const {
    OK,
    ServerError,
    NotAcceptable,
    Unauthorized,
    NotFound
}                         = require("../config/statusCodes");

Auth.login = async (req, res) => {
    try {
      const { phone_no, password } = req.body;
      const user = await User.findOne({ phone_no });
      if (!user) {
        return responseHandler(res, NotAcceptable, `Invalid phone number and password!`);
      }
      const verifyPwd = await passwordHandler.comparePwd(password, user.password);
      if (verifyPwd) {
        const accessToken = jwt.sign({ phone_no }, process.env.JWT_ACCESS_TOKEN, {
          expiresIn: "24h"
        });
        const refreshToken = jwt.sign({ phone_no }, process.env.JWT_REFRESH_TOKEN);
        user._doc.accessToken  = accessToken;
        user._doc.refreshToken = refreshToken;
        return responseHandler(res, OK, `Login Successfully!`, user);
      } else {
        return responseHandler(res, NotAcceptable, `Invalid phone number and password!`);
      }
    } catch (error) {
      return responseHandler(res, ServerError, error.message);
    }
};

Auth.register = async (req, res) => {
    try {
        const payload = {
          name: req.body.name,
          phone_no: req.body.phone_no,
          vehical_no: req.body.vehical_no,
          password: req.body.password,
          device_type: req.body.device_type,
          token: req.body.token,
        };
        const user = await User.find({
          $or: [
            { phone_no: payload.phone_no },
            { vehical_no: payload.vehical_no }
          ]
        });
        if (user.length > 0) {
          return responseHandler(res, NotAcceptable, `This vehical no and phone no are already taken!`);
        } else {
          const accessToken  = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN, { expiresIn: "1h" });
          const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN);
          payload.password   = await passwordHandler.generatePwd(payload.password);
          payload.uuid       = uuidv4();
          const user = new User(payload);
          await user.save();
          user._doc.accessToken  = accessToken;
          user._doc.refreshToken = refreshToken;
          responseHandler(res, OK, `Register Successfully!`, {
            id: user._id,
            ...user._doc,
          });
        }
    } catch (error) {
      responseHandler(res, ServerError, error.message);
    }
};

Auth.refreshToken      = (req, res) => {
    const {
      email,
      refreshToken 
    }                  = req.body;
    const isValid      = verifyRefresh(email, refreshToken);
    if (!isValid) {
      responseHandler(res, Unauthorized, `Invalid token,try login again!`);
    }
    const accessToken  = jwt.sign({ email: email }, jwtAccessKey, {
      expiresIn: "10m"
    });
    responseHandler(res, OK, `New Access Token!`, { accessToken: accessToken });
};

Auth.checkExpirationOfDocs = async (uuid) => {
  try {
    const today = new Date();
    const types = ['driving', 'insurance', 'puc', 'rc','service'];
    for (const type of types) {
      const doc = await Documents.findOne({ uuid, type });
      if (doc && doc.vaild_till) {
        const expiryDate = new Date(doc.vaild_till);
        const timeDiff   = expiryDate - today;
        const daysLeft   = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        // Only for documents expiring in next 15 days (but not expired or today)
        if (daysLeft > 0 && daysLeft <= 15) {
          // Optional: Update status if needed
          await Documents.updateOne({ _id: doc._id }, { $set: { status: 1 } });
          // Check if notification for this day already exists
          const alreadyNotified = await Notification.findOne({
            uuid,
            docType: type,
            daysLeft,
            expiryDate
          });
          if (!alreadyNotified) {
            const message = `Your ${type} document '${doc.name}' will expire in ${daysLeft} day(s).`;
            await Notification.create({
              uuid,
              docType: type,
              message,
              expiryDate,
              daysLeft,
            });
            console.log(`Notification created for ${type}: ${message}`);
          } else {
            console.log(`Notification already sent for ${type} ${daysLeft} days before expiry.`);
          }
        } else {
          console.log(`No notification needed for ${type}, daysLeft: ${daysLeft}`);
        }
      } else {
        console.log(`No ${type} document found for user ${uuid}`);
      }
    }
  } catch (error) {
    console.error("Error checking/creating notifications:", error);
  }
};

Auth.updateConfig = async (req, res) => {
    try {
      const { device_type, device_token, uuid } = req.body;
      const updateResult = await User.findOneAndUpdate(
        { uuid: uuid },
        { device_type, token: device_token },
        { new: true, useFindAndModify: false }
      );
      if (!updateResult) {
        return responseHandler(res, NotFound, 'User not found!');
      }
      let wallet     = await Wallet.findOne({ uuid });
      wallet         = (wallet)? wallet : 0;
      wallet.balance = (wallet.balance)? Math.floor(wallet.balance) : 0;
      let docs       = await Documents.find({ uuid });
      if (docs && docs.length > 0) {
        await Auth.checkExpirationOfDocs(uuid);
      }
      responseHandler(res, OK, 'Configuration updated successfully!', { 
        amount: wallet,
        docs: docs
      });
    } catch (error) {
      responseHandler(res, ServerError, error.message);
    }
};

Auth.updateProfile = async (req, res) => {
  try {
    const { uuid, name, phone_no, vehical_no } = req.body;
    const updateResult = await User.findOneAndUpdate(
      { uuid },
      { name, phone_no, vehical_no },
      { new: true, useFindAndModify: false, runValidators: true }
    );
    if (!updateResult) {
      return responseHandler(res, NotFound, 'User not found!');
    }
    responseHandler(res, OK, 'Profile updated successfully!', {
      user: name,
      phone_no: phone_no,
      vehical_no: vehical_no
    });
  } catch (error) {
    responseHandler(res, ServerError, error.message);
  }
};

Auth.deleteAccount = async (req, res) => {
  try {
    const { uuid } = req.body;
    const userDeletion = await User.findOneAndDelete({ uuid });
    if (!userDeletion) {
      return responseHandler(res, NotFound, 'User not found!');
    }
    await Wallet.deleteOne({ uuid });
    await Payments.deleteMany({ uuid });
    responseHandler(res, OK, 'Account and related records deleted successfully!');
  } catch (error) {
    responseHandler(res, ServerError, error.message);
  }
};

Auth.qr               = async (req, res) => {
  const uuid          = req.params.uuid;
  const appScheme     = `myapp://scan/${uuid}`; // Deep link to open app
  const playStoreLink = "https://play.google.com/store/apps/details?id=com.hifamily.hidaddy";
  const html = `
    <html>
    <head>
      <title>Redirecting...</title>
      <script>
        var appScheme = "${appScheme}";
        var playStoreLink = "${playStoreLink}";
        setTimeout(function() {
          window.location.href = playStoreLink; // Redirect to Play Store if the app isn't installed
        }, 3000);
        window.location.href = appScheme; // Try to open the app
      </script>
    </head>
    <body>
      <p>Redirecting to the app...</p>
    </body>
    </html>
  `;
  res.send(html);
};

module.exports = Auth