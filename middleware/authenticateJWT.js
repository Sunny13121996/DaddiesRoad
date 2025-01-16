require('dotenv').config();

const jwt             = require('jsonwebtoken');
const jwtKey          = process.env.JWT_TOKEN;
const jwtAccessKey    = process.env.JWT_ACCESS_TOKEN;
const jwtRefreshKey   = process.env.JWT_REFRESH_TOKEN;
const { responseHandler } = require("../helper/helper");
const {
  NotFound,
  Unauthorized
}                         = require("../config/statusCodes");

const isAuthenticated  = (req, res, next) => {
  try {
    let token          = req.get("authorization");
    if (!token){
      responseHandler(res, NotFound, `Token not found`);
    } else {
      token            = token.split(" ")[1];
      jwt.verify(token, jwtAccessKey, (error, user) => {
        if (error) {
          responseHandler(res, Unauthorized, error.message);
        } else {
          req.users = user;
          next();
        }
      });
    }
  } catch (error) {
    responseHandler(res, Unauthorized, error.message);
  }
};

const verifyRefresh   = (email, token) => {
  try {
    const decoded     = jwt.verify(token, jwtRefreshKey);
    return decoded.email === email;
  } catch (error) {
    return false;
  }
};

module.exports        = {
  isAuthenticated,
  verifyRefresh,
};