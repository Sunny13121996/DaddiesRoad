require('dotenv').config();

const { responseHandler, passwordHandler } = require("../helper/helper");
const Razorpay            = require("razorpay");
const crypto              = require("crypto");
const Payment             = {};
const {Payments}          = require("../models/Payments");
const {User}              = require("../models/User");
const {Wallet}            = require("../models/Wallet");
const {
    OK,
    ServerError,
    NotFound,
    NotAcceptable,
    Unauthorized
}                         = require("../config/statusCodes");

const razorpay                           = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });

Payment.createOrder                      = async (req, res) => {
    try {
        let { amount, uuid, currency, payment_from } = req.body;
        amount                           = amount * 100;
        const user                       = await User.findOne({ uuid: uuid });
        const date                       = Date.now();
        let receipt                      = `order_${user.phone_no}_rcptid_${date}`;
        if (payment_from == 'subscription') {
            receipt                      = `order_${user.phone_no}_lyftime_rcptid_${date}`;
        }
        const order                      = await razorpay.orders.create({
            amount: amount,
            currency: currency,
            receipt: receipt,
            payment_capture: 1,
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
                currency: order.currency,
                payment_from: payment_from,
                uuid: uuid
            };
            const payement = new Payments(orderReceipt);
            await payement.save();
        }
        return responseHandler(res, OK, `Payment Successfully!`, order);
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Payment.verifyPayment           = async (req, res) => {
    try {
        let { 
            razorpay_order_id, 
            razorpay_payment_id, 
            razorpay_signature, 
            uuid,
            amount,
            payment_from 
        }                        = req.body; 
        amount                   = amount / 100;
        const hmac               = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
        hmac.update(`${razorpay_order_id}|${razorpay_payment_id}`);
        const generatedSignature = hmac.digest("hex");
        if (generatedSignature === razorpay_signature) {
            if (payment_from == 'subscription') {
                await User.findOneAndUpdate(
                    { uuid: uuid },
                    { is_subscribed: true },
                    { new: true, useFindAndModify: false }
                );
            } else {
                await Wallet.findOneAndUpdate({ uuid: uuid }, { $inc: { balance: amount } }, { upsert: true });
            }
            return responseHandler(res, OK, `Payment Verified Successfully!`, { payment_id: razorpay_payment_id });
        } else {
            return responseHandler(res, NotFound, `Invalid signature`);
        }
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }  
};

module.exports = Payment;