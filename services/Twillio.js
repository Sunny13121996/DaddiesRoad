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
        const accountSid   = process.env.TWILIO_ACCOUNT_SID;
        const authToken    = process.env.TWILIO_AUTH_TOKEN;
        const twilioClient = twilio(accountSid, authToken);
        const twilioPhone  = process.env.TWILIO_PHONE_NUMBER; // Twilio Number
        const COST_PER_MIN = parseInt(process.env.COST_PER_MIN); // Cost per minute

        // Find user and wallet
        const user         = await User.findOne({ uuid, vehical_no });
        if (!user) {
            return responseHandler(res, NotFound, "This vehicle is not associated with us!");
        }

        let wallet = await Wallet.findOne({ uuid });
        if (!wallet || wallet.balance < COST_PER_MIN) {
            const twiml = new twilio.twiml.VoiceResponse();
            twiml.say("You do not have enough balance to make this call.");
            return res.type("text/xml").send(twiml.toString());
        }

        // Start the call
        const call = await twilioClient.calls.create({
            url: `https://daddiesroad.onrender.com/api/makeCall?phone=${toPhone}`,
            to: toPhone,
            from: twilioPhone,
            statusCallback: `https://daddiesroad.onrender.com/api/callStatus?uuid=${uuid}`,
            // statusCallback: `http://localhost:7001/api/callStatus?uuid=${uuid}`,
            statusCallbackEvent: ["completed"]
        });

        res.json({
            success: true,
            message: "Call initiated successfully.",
            callSid: call.sid
        });

    } catch (error) {
        console.log(`error==`,error)
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.callStatus = async (req, res) => {
    try {
        const { uuid, CallDuration } = req.query;
        const COST_PER_MIN           = parseInt(process.env.COST_PER_MIN);
        let wallet                   = await Wallet.findOne({ uuid });
        if (!wallet) {
            return responseHandler(res, NotFound, "Wallet not found!");
        }
        const duration               = parseInt(CallDuration) || 0;
        const minutes                = Math.ceil(duration / 60);
        const totalCharge            = minutes * COST_PER_MIN;
        if (wallet.balance >= totalCharge) {
            wallet.balance -= totalCharge;
            await wallet.save();
            return res.json({
                success: true,
                message: `Call ended. Charged ${totalCharge} for ${minutes} minutes.`,
                remaining_balance: wallet.balance
            });
        } else {
            return res.json({
                success: false,
                message: "Not enough balance for the full duration.",
                charged: wallet.balance,
                remaining_balance: 0
            });
        }
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

module.exports = Twillio;