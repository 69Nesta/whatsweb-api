const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail, sendmailforgotpassword } = require('./mail');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone } = require('../functions');

const blacklist_mail = ['no-reply@whatsweb.fr', 'support@whatsweb.fr', 'contact@whatsweb.fr', 'noreply@discord.com']

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.register = (req, res) => {

    const { name, surname, email, phone, pass1, pass2, accepted } = req.body;

    let phonenum = phone;

    if (!validatePhone(phone)) {
        phonenum = null;
    }

    if (!validateEmail(email)) {
        return res.send('Ce courriel est invalide !')
    }

    if (blacklist_mail.includes(String(email).toLowerCase())) {
        return res.send('Ce courriel est invalide !')
    }

    db.query('SELECT mail FROM users WHERE mail = ?', [String(email).toLowerCase()], async (error, results) => {
        if (error) {
            console.log(error);
        }
        db.query('SELECT mail_verif_uuid,public_uuid FROM users', [], async (error1, results1) => {
            if (error1) {
                console.log(error1);
            }

            if (results.length > 0) {
                return res.send('Ce courriel est déjà utilisé');
            } else if (pass1 !== pass2) {
                return res.send('Les mots de passe ne correspondent pas');
            } else if (pass1.length < 6) {
                return res.send('Le mot de passe est trop cours, il doit faire minimum 6 characters');
            } else if (!accepted) {
                return res.send('Veuillez accepter les conditions d\'utilisation');
            }

            let hashedPassword = await bcrypt.hash(pass1, 8);

            let mail_verif_uuid = await random_str(20);
            let public_uuid = await random_str(20);

            for (let i = 0; i < 1;) {
                if (results1.filter(function (e) { return e.mail_verif_uuid == mail_verif_uuid; }).length > 0) {
                    mail_verif_uuid = random_str(20);
                } else { i = 1; }
            }
            for (let i = 0; i < 1;) {
                if (results1.filter(function (e) { return e.public_uuid == public_uuid; }).length > 0) {
                    public_uuid = random_str(20);
                } else { i = 1; }
            }

            let ip = req.socket.remoteAddress.split('::ffff:')[1];
            if (ip == undefined) { ip = 'introuvable'; }

            db.query('INSERT INTO users SET ?', { name: name, surname: surname, mail: String(email).toLowerCase(), phone: phonenum, password: hashedPassword, mail_verif_uuid: mail_verif_uuid, public_uuid: public_uuid, theme: 0, der_date: new Date(), der_ip: ip }, (error, results) => {
                if (error) {
                    console.log(error);
                } else {

                    let id = results.insertId
                    db.query('SELECT jwt_key FROM accounts', [], (error1, results1) => {

                        let jwt_key = random_str(100)
                        if (results1 > 0) {
                            while (results1.jwt_key.include(jwt_key)) {
                                jwt_key = random_str(100)
                            }
                        }
                        // const token = jwt.sign({ id }, process.env.JWT_SECRET, {
                        //     expiresIn: process.env.JWT_EXPIRES_IN
                        // });

                        // const cookieOptions = {
                        //     expires: new Date(
                        //         Date.now() + process.env.JWT_COOKIE_EXPIRES * 24 * 60 * 60 * 1000
                        //     ),
                        //     httpOnly: true
                        // }

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

                            res.cookie('jwt', token, cookieOptions);
                            sendmail(email, mail_verif_uuid);
                            // res.cookie('jwt', token, cookieOptions);
                            // res.status(200).redirect("/");
                            res.status(200).send("redirect");
                        });
                    });
                }
            });
        });
    });
}