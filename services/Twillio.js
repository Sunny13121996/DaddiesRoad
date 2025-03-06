require('dotenv').config();

const { responseHandler, passwordHandler } = require("../helper/helper");
const Twillio             = {};
const {User}              = require("../models/User");
const {Wallet}            = require("../models/Wallet");
const twilio              = require("twilio");
const {
    OK,
    ServerError,
    NotFound,
    NotAcceptable,
    Unauthorized
}                         = require("../config/statusCodes");

const accountSid          = process.env.TWILIO_ACCOUNT_SID;
const authToken           = process.env.TWILIO_AUTH_TOKEN;
const twilioClient        = twilio(accountSid, authToken);

Twillio.makeCall          = async (req, res) => {
    try {
        const params      = req.query;
        const twiml       = new twilio.twiml.VoiceResponse();
        twiml.say("Please wait while we connect your call.");
        twiml.dial(params.phone);
        res.type("text/xml").send(twiml.toString());
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.inBoundCall = async (req, res) => {
    try {
        let { vehical_no, uuid, toPhone } = req.body;
        const twilioPhone  = process.env.TWILIO_PHONE_NUMBER; // Twilio Number
        const COST_PER_MIN = parseInt(process.env.COST_PER_MIN); // Cost per minute

        // Find user and wallet
        const user         = await User.findOne({ uuid, vehical_no });
        if (!user) {
            return responseHandler(res, NotFound, "This vehicle is not associated with us!");
        }

        let wallet = await Wallet.findOne({ uuid });
        if (!wallet || Math.floor(wallet.balance) <= 0) {
            const twiml = new twilio.twiml.VoiceResponse();
            twiml.say("You do not have enough balance to make this call.");
            return res.type("text/xml").send(twiml.toString());
        }

        // Start the call
        const call = await twilioClient.calls.create({
            url: `https://daddiesroad.onrender.com/api/makeCall?phone=${toPhone}`,
            to: toPhone,
            from: twilioPhone,
            // statusCallback: `https://daddiesroad.onrender.com/api/callStatus?uuid=${uuid}`,
            statusCallbackEvent: ["completed"]
        });

        responseHandler(res, OK, 'Call initiated successfully.!', { 
            call: call.sid 
        });
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.callStatus       = async (req, res) => {
    try {
        let { call_sid } = req.query;
        const { sid, status, startTime, endTime, duration, price, priceUnit } = await twilioClient.calls(call_sid).fetch();
        responseHandler(res, OK, 'Call initiated successfully.!', 
            { sid, status, startTime, endTime, duration, price, priceUnit }
        );
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.deductedFromWallet  = async (req, res) => {
    try {
        let { 
            uuid, 
            startTime, 
            endTime, 
            duration, 
            price, 
            usd 
        }                   = req.body;
        let wallet          = await Wallet.findOne({ uuid });
        if (!wallet) {
            return responseHandler(res, NotFound, "Wallet not found!");
        }
        startTime           = new Date(startTime);
        endTime             = new Date(endTime);
        duration            = Math.floor((endTime - startTime) / 1000);
        const minutes       = Math.ceil((duration % 3600) / 60);
        const totalChargeINR  = Math.abs(price * usd);
        if (wallet.balance >= totalChargeINR) {
            wallet.balance -= totalChargeINR;
            await wallet.save();
            responseHandler(res, OK, `Call ended. Charged ${totalChargeINR} for ${minutes} minutes.`, 
                { remaining_balance: Math.floor(wallet.balance) }
            );
        } else {
            responseHandler(res, NotAcceptable, `Not enough balance for the full duration.`, 
                { remaining_balance: Math.floor(wallet.balance) }
            );
        }
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

module.exports = Twillio;