const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail, sendmailforgotpassword } = require('./mail');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone } = require('../functions');
const https = require('https');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 3 })
        }

        db.query('SELECT id,password FROM users WHERE mail = ?', [email], async (error, results) => {

            if (results.length == 0) {
                res.status(401).json({ error: 4 })
            } else if (!results || !(await bcrypt.compare(password, results[0].password))) {
                res.status(401).json({ error: 4 })
            } else {
                const id = results[0].id;

                db.query('SELECT jwt_key FROM accounts', [], (error1, results1) => {

                    let jwt_key = random_str(100)
                    if (results1 > 0) {
                        while (results1.jwt_key.include(jwt_key)) {
                            jwt_key = random_str(100)
                        }
                    }

                    let ip;
                    if (req.socket.remoteAddress == undefined) {
                        ip = 'introuvable';
                    } else {
                        ip = req.socket.remoteAddress.split('::ffff:')[1];
                        if (ip == undefined) { ip = 'introuvable'; }
                    }

                    db.query('INSERT INTO accounts SET ?', { user_id: id, jwt_key: jwt_key, devices: req.useragent.source, der_ip: ip, expire: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000) }, (error2, results2) => {
                        const token = jwt.sign({ jwt_key }, process.env.JWT_SECRET, {
                            expiresIn: process.env.JWT_EXPIRES_IN
                        });

                        const cookieOptions = {
                            expires: new Date(
                                Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                            ),
                            httpOnly: true
                        }

                        res.cookie('jwt', token, cookieOptions)
                        res.status(200).json({ error: false })
                    });
                });

            }

        });

    } catch (error) {
        console.log(error);
    }
}