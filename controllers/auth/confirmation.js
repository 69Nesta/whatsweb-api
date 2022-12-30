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

exports.confirmation = async (req, res) => {
    var email = req.query.email;
    var key = req.query.key;

    db.query('SELECT * FROM users WHERE mail = ? AND mail_verif_uuid = ?', [email, key], async (error, results) => {
        if (results.length > 0) {
            db.query("UPDATE users SET email_confirmed = 1, mail_verif_uuid = ? WHERE id = ?", [random_str(20), results[0].id], (error1, results1) => {
                return res.json({ error: false });
            });
        } else
            return res.json({ error: 'redirect' });
    });
}