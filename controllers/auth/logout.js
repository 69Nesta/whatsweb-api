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

exports.logout = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt)

    db.query('DELETE FROM accounts WHERE jwt_key = ? AND user_id = ?', [decoded.jwt_key, decoded.id], (error, result) => {

        res.cookie('jwt', 'logout', {
            expires: new Date(Date.now() + 2 * 1000),
            httpOnly: true
        });
    
        res.status(200).json({ error: false })
    })
}