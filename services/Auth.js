require('dotenv').config();

const { responseHandler, passwordHandler } = require("../helper/helper");
const {User}              = require("../models/User");
const Auth                = {};
const jwtKey              = process.env.JWT_TOKEN;
const jwtAccessKey        = process.env.JWT_ACCESS_TOKEN;
const jwt                 = require("jsonwebtoken");
const { verifyRefresh } = require("../middleware/authenticateJWT");
const {
    OK,
    ServerError,
    NotAcceptable,
    Unauthorized
}                         = require("../config/statusCodes");

Auth.login = async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return responseHandler(res, NotAcceptable, `Invalid email and password!`);
      }
      const verifyPwd = await passwordHandler.comparePwd(password, user.password);
      if (verifyPwd) {
        const accessToken = jwt.sign({ email }, process.env.JWT_ACCESS_TOKEN, {
          expiresIn: "10m"
        });
        const refreshToken = jwt.sign({ email }, process.env.JWT_REFRESH_TOKEN);
        user._doc.accessToken  = accessToken;
        user._doc.refreshToken = refreshToken;
        return responseHandler(res, OK, `Login Successfully!`, user);
      } else {
        return responseHandler(res, NotAcceptable, `Invalid email and password!`);
      }
    } catch (error) {
      return responseHandler(res, ServerError, error.message);
    }
};

Auth.register = async (req, res) => {
    try {
        const payload = {
          name: req.body.name,
          email: req.body.email,
          password: req.body.password,
          country_code: req.body.country_code,
          phone_no: req.body.phone_no,
          device_type: req.body.device_type,
          token: req.body.token,
        };
        const user = await User.find({
          $or: [
            { email: payload.email },
            { phone_no: payload.phone_no }
          ]
        });
        if (user.length > 0) {
          return responseHandler(res, NotAcceptable, `This email and phone are already taken!`);
        } else {
          // Encrypt the password before saving;
          const accessToken = jwt.sign(payload, process.env.JWT_ACCESS_TOKEN, { expiresIn: "10m" });
          const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_TOKEN);
          payload.password = await passwordHandler.generatePwd(payload.password);
          // Create and save the user
          const user = new User(payload);
          await user.save();
          user._doc.accessToken  = accessToken;
          user._doc.refreshToken = refreshToken;
          // Respond with success and include the user (if needed, include `_id` explicitly as `id`)
          responseHandler(res, 200, `Register Successfully!`, {
            id: user._id, // Add `_id` as `id` if needed
            ...user._doc, // Spread the rest of the user fields
          });
        }
    } catch (error) {
      responseHandler(res, 500, error.message);
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

Auth.updateConfig = async (req, res) => {
    try {
      const { device_type, device_token, driver_id } = req.body;
      const updateResult = await Driver.findOneAndUpdate(
        { uuid: driver_id },
        { device_type, device_token },
        { new: true, useFindAndModify: false }
      );
      if (!updateResult) {
        return responseHandler(res, 404, 'Driver not found!');
      }
      responseHandler(res, 200, 'Configuration updated successfully!', updateResult);
    } catch (error) {
      responseHandler(res, 500, error.message);
    }
};

module.exports = Auth