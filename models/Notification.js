const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  uuid: { type: String, required: true }, // user identifier
  docType: { type: String, required: true },
  message: { type: String, required: true },
  notifyDate: { type: Date, default: Date.now },
  expiryDate: { type: Date, required: true },
  daysLeft: { type: Number, required: true },
  is_delete: { type: Boolean, required: true, default: false },
  is_read: { type: Boolean, required: true, default: false },
});

const Notification = mongoose.model('Notification', NotificationSchema);
module.exports = { Notification }
