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

Twillio.maskPhoneNumber   = (phone) => {
    return phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2');
};

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
        let { vehical_no, uuid } = req.body;
        const twilioPhone  = process.env.TWILIO_PHONE_NUMBER; // Twilio Number

        // Find user and wallet
        const user         = await User.findOne({ uuid, vehical_no });
        if (!user) {
            return responseHandler(res, NotFound, "This vehicle is not associated with us!");
        }

        // let wallet      = await Wallet.findOne({ uuid });
        // if (!wallet || Math.floor(wallet.balance) <= 0) {
        //     const twiml = new twilio.twiml.VoiceResponse();
        //     twiml.say("You do not have enough balance to make this call.");
        //     return res.type("text/xml").send(twiml.toString());
        //     responseHandler(res, NotAcceptable, `You do not have enough balance to make this call.`);
        // }

        const toPhone      = "+91"+user.phone_no;
        const userName     = user.name;

        // Start the call
        const call = await twilioClient.calls.create({
            url: `https://daddiesroad.onrender.com/api/makeCall?phone=${toPhone}`,
            to: toPhone,
            from: twilioPhone,
            // statusCallback: `https://daddiesroad.onrender.com/api/callStatus?uuid=${uuid}`,
            statusCallbackEvent: ["completed"]
        });

        responseHandler(res, OK, 'Call initiated successfully.!', { 
            call: call.sid,
            toPhone: Twillio.maskPhoneNumber(toPhone),
            userName: userName
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
            usd,
            call_sid,
            call_status
        }                    = req.body;
        let wallet           = await Wallet.findOne({ uuid });
        if (!wallet) {
            return responseHandler(res, NotFound, "Wallet not found!");
        }
        if (call_sid && (call_status && call_status == "in-progress")) {
            await twilioClient.calls(call_sid).update({ status: 'completed' });
        }
        startTime            = new Date(startTime);
        endTime              = new Date(endTime);
        duration             = Math.floor((endTime - startTime) / 1000);
        const minutes        = Math.ceil((duration % 3600) / 60);
        const seconds        = minutes * 60;
        // const totalChargeINR = Math.abs(price * usd); // It was calculating as per dynamic cut offs.
        const totalChargeINR = parseInt(process.env.CALL_PER_AMOUNT); // Per Call For 45 Seconds
        if (wallet.balance >= totalChargeINR) {
            wallet.balance -= totalChargeINR;
            await wallet.save();
            // `Call ended. Charged ${Math.floor(totalChargeINR)}rs for ${minutes} minutes.`
            responseHandler(res, OK, `Call ended. Charged ${Math.floor(totalChargeINR)}rs for ${seconds} seconds.`, 
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