const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail, sendmailforgotpassword } = require('./mail');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone } = require('../functions');
const { getdecoded } = require('../getdecoded');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.subscription = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt)

    const subscription = JSON.parse(req.body.subscription);

    if (subscription.endpoint && subscription.keys.p256dh && subscription.keys.auth) {
        db.query('UPDATE accounts SET webpush_endpoint = ?, webpush_key_p256dh = ?, webpush_key_auth = ? WHERE jwt_key = ?', [subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth, decoded.jwt_key], (e, r) => {
            return res.send("Ok")
        });
    } else {
        return res.send("Error")
    }

}