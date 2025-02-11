require('dotenv').config();

const { responseHandler, passwordHandler } = require("../helper/helper");
const Razorpay            = require("razorpay");
const Payments            = {};
const razorKeyId          = process.env.RAZORPAY_KEY_ID;
const razorKeySecret      = process.env.RAZORPAY_KEY_SECRET;
const {Payments}          = require("../models/Payments");
const {User}              = require("../models/User");
const {
    OK,
    ServerError,
    NotAcceptable,
    Unauthorized
}                         = require("../config/statusCodes");

const razorpay                           = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
  
Payments.createOrder                     = async (req, res) => {
    try {
        const { amount, uuid }           = req.body;
        const currency                   = "INR";
        const user                       = await User.findOne({ uuid: uuid });
        const date                       = Date.now();
        const order                      = await razorpay.orders.create({
            amount: amount * 100,
            currency: currency,
            receipt: `order_${user.name}_${user.phone_no}_rcptid_${date}`,
            notes: {
                user: `${user.vehical_no}-${user.uuid}`
            }
        });
        if ('id' in order) {
            const orderReceipt = {
                order_id: order.id,
                amount: order.amount,
                amount_paid: order.amount_paid,
                amount_due: order.amount_due,
                currency: currency,
                uuid: uuid
            };
            const payement = new Payments(orderReceipt);
            await payement.save();
            await User.findOneAndUpdate(
                { uuid: uuid },
                { is_subscribed: true },
                { new: true, useFindAndModify: false }
            );
        }
        return responseHandler(res, OK, `Payment Successfully!`, order);
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

module.exports = Payments