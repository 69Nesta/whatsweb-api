const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail, sendmailforgotpassword } = require('./mail');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.forgotpassword = async (req, res) => {

    const { email } = req.body;
    
    if (!email) return res.json({ error: 2 })
    
    db.query('SELECT * FROM users WHERE mail = ?', [email], async (error, results) => {

        if (results.length > 0) {
            sendmailforgotpassword(email, results[0].mail_verif_uuid);
            return res.json({ error: false })
        } else {
            return res.json({ error: 2 })
        }
    });

}