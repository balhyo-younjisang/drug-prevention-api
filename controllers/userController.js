import User from "../models/User.js";
import bcrypt from "bcrypt";
import CryptoJS from "crypto-js";
import axios from "axios";

export const postJoin = async (req, res) => {
    const { id, email, password, name, confirmPassword, phoneNumber } = req.body; // get data

    // password is not match
    if (password != confirmPassword) return res.send("Password confirmation does not match.");

    // find user-id and email in db
    const userIdExists = await User.exists({ id });
    const emailExists = await User.exists({ email });

    if (userIdExists || emailExists) return res.send("name or email is already taken.");

    // create User data
    await User.create({
        id, email, name, password, phoneNumber
    });

    // joins succees
    return res.send("success join");
}

export const postLogin = async (req, res) => {
    const { id, password } = req.body; // get data
    const user = await User.findOne({ id }); // find user-data in db
    if (!user) return res.send("An account with this id does not exists"); // no user at db

    const confirm = await bcrypt.compare(password, user.password); // confirm password
    if (!confirm) return res.send("Wrong password"); // not match password

    req.session.user = user;
    req.session.loggedIn = true;

    return res.send("success login");
}

export const sendSMS = async (req, res) => {
    const {
        session: {
            user: { phoneNumber }
        }
    } = req;
    const date = Date.now().toString(); // date(String)

    // environment variable
    const service_id = process.env.NCP_SERVICE_ID;
    const access_key = process.env.NCP_API_ACCESS_KEY;
    const secret_key = process.env.NCP_API_SECRET;
    const call_number = process.env.CALL_NUMBER;

    // request variable
    const space = " ";
    const nl = "\n";
    const req_url = `https://sens.apigw.ntruss.com/sms/v2/services/${service_id}/messages`;
    const signature_url = `/sms/v2/services/${service_id}/messages`;
    const method = "POST";

    // signature
    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, secret_key);
    hmac.update(method); // method
    hmac.update(space);
    hmac.update(signature_url); // url
    hmac.update(nl);
    hmac.update(date); // date
    hmac.update(nl);
    hmac.update(access_key);

    const hash = hmac.finalize();
    const signature = hash.toString(CryptoJS.enc.Base64);

    // send request to SENS server
    const response_sms = await axios({
        method: method,
        url: req_url,
        headers: {
            "Content-Type": "application/json; charset=utf-8",
            "x-ncp-iam-access-key": access_key,
            "x-ncp-apigw-timestamp": date,
            "x-ncp-apigw-signature-v2": signature,
        },
        data: {
            type: "SMS",
            countryCode: "82",
            from: call_number,
            content: "success send sms",
            messages: [{ to: `${phoneNumber}` }],
        }
    })


    return res.send(response_sms.data);
}

export const logout = (req, res) => {
    req.session.destroy();
    return res.send("logout");
}