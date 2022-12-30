const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail, sendmailforgotpassword } = require('./mail');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone } = require('../functions');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.close = async (req, res) => {

    var email = req.query.email;
    var key = req.query.key;

    db.query('SELECT * FROM users WHERE mail = ? AND mail_verif_uuid = ?', [email, key], async (error, results) => {
        if (results.length > 0) {
            if (results[0].closed == 0) {
                db.query("UPDATE users SET closed = 1 WHERE id = ?", [results[0].id], (error1, results1) => {
                    return res.json({ error: false, result: 'close' });
                });
            } else {
                db.query("UPDATE users SET closed = 0 WHERE id = ?", [results[0].id], (error1, results1) => {
                    return res.json({ error: false, result: 'open' });
                });
            }
        } else
            return res.json({ error: 'redirect' });
    });

}