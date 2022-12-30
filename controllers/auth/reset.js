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


exports.forgotpasswordreset = async (req, res) => {

    const { repeatPassword, password, email, key } = req.body;

    if ((password !== repeatPassword) && (password !== '') && (repeatPassword !== '')) {
        return res.render('reset', {
            message: 'Les mots de passe ne correspondent pas'
        });
    } else if ((password.length < 6) && (password !== '') && (repeatPassword !== '')) {
        return res.render('reset', {
            message: 'Le mot de passe est trop cours, il doit faire minimum 6 characters'
        });
    }
    let hashedPassword = await bcrypt.hash(password, 8);
    db.query("UPDATE users SET password = ? WHERE mail = ? AND mail_verif_uuid = ?", [hashedPassword, email, key], (error, results) => {
        if (error) {
            console.log(error);
        }
        return res.redirect('/login');
    });

}