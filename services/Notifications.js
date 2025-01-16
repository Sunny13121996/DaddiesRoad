require('dotenv').config();

const { responseHandler, paginate }   = require("../helper/helper");
const Notification          = {};
const {
    OK,
    ServerError
}                                   = require("../config/statusCodes");

Notification.notifications          = async (req, res) => {
    try {
        const getTotalNotifications = (notificationsValues) => {
            return new Promise((resolve, rejects) => {
                connection.query(`SELECT notifications_id, type, title, message, to_id, is_read FROM notifications WHERE is_read = 0 AND to_user = ?`, notificationsValues, (err, success)=>{
                    (err)? rejects(err): resolve(success.length);
                });
            })
        };
        let notificationsQuery   = {};
        let notificationsValues  = {};
        const post               = req.body;
        const response           = {};
        if (post.action == "get_notification") {
            notificationsQuery   = `SELECT notifications_id, type, title, message, to_id, is_read, created FROM notifications WHERE to_user = ? AND is_delete = 0 ORDER BY created DESC LIMIT ${paginate(req.body.page)}`;
            notificationsValues  = [post.user_id];
            response.total       = await getTotalNotifications(notificationsValues);
        } else if (post.action == "mark_read") {
            notificationsQuery   = `UPDATE notifications SET is_read = 1 WHERE to_user = ?`;
            notificationsValues  = [post.user_id];
        } else {
            notificationsQuery   = `UPDATE notifications SET is_delete = 1 WHERE notifications_id = ?`;
            notificationsValues  = [post.notification_id];
        }
        connection.query(notificationsQuery, notificationsValues, (notificationsError, notificationsRows) => {
            if (notificationsError) {
                responseHandler(res, ServerError, notificationsError.message);
            } else {
                response.data    = notificationsRows;
                responseHandler(res, OK, `Notifications`, response);
            }
        });
    } catch (error) {
        responseHandler(res, ServerError, error.message);
    }
}

module.exports              = Notification;