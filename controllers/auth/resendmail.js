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

exports.resendmail = async (req, res) => {

    var email = req.body.email; //liamcleo.lefebvre@gmail.com

    db.query('SELECT mail_verif_uuid FROM users WHERE mail = ? AND email_confirmed = 0', [email], async (error, results) => {
        if (error) {
            console.log(error);
        }

        if (results.length > 0) {

            sendmail(email, results[0].mail_verif_uuid);

            return res.redirect('/confirmationemailsend?email=' + email);
        }

        return res.render('404');
    });

}