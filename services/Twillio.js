require('dotenv').config();

const { responseHandler, passwordHandler } = require("../helper/helper");
const Twillio = {};
const { User } = require("../models/User");
const { Wallet } = require("../models/Wallet");
const { CallSchema }    = require('../models/Call');
const twilio = require("twilio");
const {
    OK,
    ServerError,
    NotFound,
    NotAcceptable,
    Unauthorized
} = require("../config/statusCodes");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioClient = twilio(accountSid, authToken);

Twillio.maskPhoneNumber = (phone) => {
    return phone.replace(/(\d{2})\d{6}(\d{2})/, '$1XXXXXX$2');
};

Twillio.voice = async (req, res) => {
    try {
        console.log(`req.body===>>`, req.body)
        const payload = req.body;
        const to = payload.To;
        if (!to) {
            return res.status(400).send('Missing "To" number');
        }
        const twiml = new twilio.twiml.VoiceResponse();
        const dial = twiml.dial({ callerId: process.env.TWILIO_PHONE_NUMBER });
        dial.number(to);
        res.type('text/xml');
        res.send(twiml.toString());
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.callFallback = async (req, res) => {
    try {
        const twiml = new twilio.twiml.VoiceResponse();
        twiml.say('Sorry! We are unable to make a call');
        res.type('text/xml');
        res.send(twiml.toString());
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.callBackStatus = async (req, res) => {
    try {
        const { CallSid, CallStatus, From, To } = req.body;
        console.log('📞 Call Status Update:', req.body)
        console.log('📞 Call Status Update:', {
            CallSid,
            CallStatus,
            From,
            To
        });
        await CallSchema.findOneAndUpdate(
            { callSid: CallSid },
            { status: CallStatus, from: From, to: To, updatedAt: new Date() },
            { upsert: true }
        );
        res.sendStatus(200);
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.inBoundCall = async (req, res) => {
    try {
        let { vehical_no, uuid } = req.body;
        vehical_no = vehical_no.trim();
        uuid = uuid.trim();
        const user = await User.findOne({ uuid: uuid, vehical_no: vehical_no });
        if (!user) {
            return responseHandler(res, NotFound, "This vehicle is not associated with us!");
        }
        const toPhone = "+91" + user.phone_no;
        const userName = user.name;
        responseHandler(res, OK, 'Call initiated successfully.!', {
            toPhone: Twillio.maskPhoneNumber(toPhone),
            userName: userName,
            originalNo: toPhone
        });
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.token = (req, res) => {
    const AccessToken = require('twilio').jwt.AccessToken;
    const VoiceGrant  = AccessToken.VoiceGrant;
    const token       = new AccessToken(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_API_KEY,
        process.env.TWILIO_API_SECRET,
        { identity: 'ParkingWithQr' }
    );
    const voiceGrant = new VoiceGrant({
        outgoingApplicationSid: process.env.TWILIO_TWIML_APP_SID,
        // incomingAllow: false
    });
    token.addGrant(voiceGrant);
    const jwtToken = token.toJwt();
    responseHandler(res, OK, 'Twillio Token Authorized.!', {
        token: jwtToken
    });
};

Twillio.callStatus = async (req, res) => {
    try {
        let { call_sid } = req.query;
        // const callResponse = await twilioClient.calls(call_sid).fetch();
        const callResponse = await Call.findOneAndUpdate(
            { callSid: call_sid },
            {
                status: CallStatus,
                from: From,
                to: To,
                direction: Direction,
                duration: Duration,
                answeredBy: AnsweredBy,
                updatedAt: new Date()
            },
            { upsert: true }
        );
        responseHandler(res, OK, 'Call initiated successfully.!', {
            sid: callResponse.callSid,
            status: callResponse.status,
            startTime: callResponse.startTime || new Date(),
            endTime: callResponse.endTime || new Date(),
            duration: callResponse.duration,
            price: callResponse.price || 0,
            priceUnit: callResponse.priceUnit || 0
        });
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

Twillio.deductedFromWallet = async (req, res) => {
    try {
        let {
            uuid,
            startTime,
            endTime,
            duration,
            price,
            usd,
            call_sid,
            call_status,
            deducted_from
        }             = req.body;

        startTime     = new Date(startTime) || new Date();
        endTime       = new Date(endTime) || new Date();
        duration      = Math.floor((endTime - startTime) / 1000);
        const minutes = Math.ceil((duration % 3600) / 60);
        const seconds = minutes * 60;
        const totalChargeINR = parseInt(process.env.CALL_PER_AMOUNT);

        // For Making a runing Call End
        if (call_sid && (call_status && call_status == "completed")) {
            await twilioClient.calls(call_sid).update({ status: 'completed' });
        }

        if (deducted_from == "wallet") {
            let wallet = await Wallet.findOne({ uuid });
            if (!wallet) {
                return responseHandler(res, NotFound, "Wallet not found!");
            }
            if (wallet.balance >= totalChargeINR) {
                wallet.balance -= totalChargeINR;
                await wallet.save();

                responseHandler(res, OK, `Call ended. Charged ${Math.floor(totalChargeINR)}rs for ${seconds} seconds.`,
                    { remaining_balance: Math.floor(wallet.balance) }
                );
            } else {
                responseHandler(res, NotAcceptable, `Not enough balance for the full duration.`,
                    { remaining_balance: Math.floor(wallet.balance) }
                );
            }
        } else {
            const totalChargeINR = parseInt(process.env.CALL_PER_AMOUNT);
            responseHandler(res, OK, `Call ended. Charged ${Math.floor(totalChargeINR)}rs for ${seconds} seconds.`,
                { remaining_balance: 0 }
            );
        }
    } catch (error) {
        return responseHandler(res, ServerError, error.message);
    }
};

module.exports = Twillio;