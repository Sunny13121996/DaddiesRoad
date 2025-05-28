require('dotenv').config();

const { responseHandler, passwordHandler } = require("../helper/helper");
const {Notification}       = require('../models/Notification');
const {
    OK,
    ServerError,
}                          = require("../config/statusCodes");

Notification.notifications = async (req, res) => {
  try {
    const post             = req.body;
    const userId           = post.user_id;
    const response         = {};
    const getTotalNotifications = async (userId) => {
      const count          = await Notification.countDocuments({ uuid: userId, is_read: false });
      return count;
    };
    // Action: Get notifications
    if (post.action === "get_notification") {
      const notifications = await Notification.find({ uuid: userId, is_delete: { $ne: true } }).sort({ notifyDate: -1 }).lean();
      response.data  = notifications;
      response.total = await getTotalNotifications(userId);
      return responseHandler(res, OK, `Notifications`, response);
    }
    // Action: Mark all notifications as read
    else if (post.action === "mark_read") {
      const result = await Notification.updateMany(
        { uuid: userId, is_read: false },
        { $set: { is_read: true } }
      );
      response.data = result;
      return responseHandler(res, OK, `Notifications marked as read`, response);
    }
    // Action: Delete single notification
    else {
      const notificationId = post.notification_id;
      const result = await Notification.updateOne(
        { _id: notificationId },
        { $set: { is_delete: true } }
      );
      response.data = result;
      return responseHandler(res, OK, `Notification deleted`, response);
    }
  } catch (error) {
    return responseHandler(res, ServerError, error.message);
  }
};

module.exports              = Notification;