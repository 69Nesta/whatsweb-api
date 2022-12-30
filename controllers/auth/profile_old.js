const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail, sendmailforgotpassword } = require('./mail');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone, removeDuplicates } = require('../functions');
const { copyFile } = require("fs");

const { getdecoded } = require('../getdecoded');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { io } = require('../../index');

exports.updateprofile = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { name, surname, email, phone } = req.body;

    db.query('SELECT mail FROM users WHERE mail = ?', [email], async (error, results) => {

        db.query('SELECT mail,name,phone,surname,mail_verif_uuid FROM users WHERE id = ?', [decoded.id], async (error1, results1) => {
            let errors = [];

            const emailbase = results1[0].mail;

            let emailchange = false;

            if ((results.length > 0) && (results[0].mail !== emailbase))
                errors.push(6);

            else if (email.replaceAll(' ', '') == "" || email == null)
                errors.push(5);

            else if (!validateEmail(email))
                errors.push(5);

            else if ((results.length < 1) && (email !== emailbase)) {
                emailchange = true;

                db.query("UPDATE users SET mail = ?, email_confirmed = 0 WHERE id = ?", [email, decoded.id], (error, results) => {
                    if (!error) {
                        sendmail(email, results1[0].mail_verif_uuid);
                    }
                });
            }

            if (name !== results1[0].name) {
                if (name.replaceAll(' ', '') != "") {
                    db.query("UPDATE users SET name = ? WHERE id = ?", [name, decoded.id], (error, results) => { });
                } else {
                    errors.push(7);
                }
            }
            if (phone !== results1[0].phone) {
                if (phone.replaceAll(' ', '') == "") {
                    db.query("UPDATE users SET phone = ? WHERE id = ?", [null, decoded.id], (error, results) => { });
                } else if (validatePhone(phone)) {
                    db.query("UPDATE users SET phone = ? WHERE id = ?", [phone, decoded.id], (error, results) => { });
                } else {
                    errors.push(8);
                }
            }
            if (surname !== results1[0].surname) {
                db.query("UPDATE users SET surname = ? WHERE id = ?", [surname, decoded.id], (error, results) => { });
            }

            if (errors.length === 0) {
                sendsocketforupdate(decoded.id, decoded.jwt_key)
                if (emailchange) {
                    return res.json({ error: false, result: 'emailchange' })
                } else {
                    return res.json({ error: false })
                }
            } else {
                return res.json({ error: errors });
            }

        });
    });
}


exports.updateprofilepicture = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { user_uuid, storage_name } = req.body;

    db.query("UPDATE users SET avatar = ? WHERE id = ?", [`/attachments/download/${user_uuid}/${storage_name}`, decoded.id], (error, results) => {
        sendsocketforupdate(decoded.id, decoded.jwt_key)

        res.send("done")
    });

}



exports.updatepassword = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { lastpass, newpass } = req.body;

    if (lastpass == undefined || newpass == undefined) {
        res.send("Veuillez remplire tous les champs")
    }
    if (newpass.length < 6) {
        res.send("Le mot de passe doit faire au moins 6 carractères")
    } else {
        db.query('SELECT password FROM users WHERE id = ?', [decoded.id], async (error, results) => {
            if (await bcrypt.compare(lastpass, results[0].password)) {

                let hashedPassword = await bcrypt.hash(newpass, 8);

                db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id], async (error2, results2) => {
                    res.send("done")
                })
            } else {
                res.send("Mot de passe incorrect")
            }
        })
    }
}

exports.setstatus = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { status } = req.body;

    if (status == undefined) {
        res.send("error1")
    } else {
        if (status == 0 || status == 1 || status == 2) {
            db.query('UPDATE users SET public_status = ? WHERE id = ?', [status, decoded.id], async (error2, results2) => {
                sendsocketforupdate(decoded.id, decoded.jwt_key)
                res.send("done")
            })
        } else {
            res.send("error2")
        }
    }

}

exports.setpublic_avatar = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { status } = req.body;

    if (status == undefined) {
        res.send("error1")
    } else {
        if (status == 0 || status == 1) {
            db.query('UPDATE users SET public_avatar = ? WHERE id = ?', [status, decoded.id], async (error2, results2) => {
                sendsocketforupdate(decoded.id, decoded.jwt_key)
                res.send("done")
            })
        } else {
            res.send("error2")
        }
    }
}

exports.setpublic_phone = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { status } = req.body;

    if (status == undefined) {
        res.send("error1")
    } else {
        if (status == 0 || status == 1) {
            db.query('UPDATE users SET public_phone = ? WHERE id = ?', [status, decoded.id], async (error2, results2) => {
                sendsocketforupdate(decoded.id, decoded.jwt_key)
                res.send("done")
            })
        } else {
            res.send("error2")
        }
    }
}

exports.setfriendtotalk = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { status } = req.body;

    if (status == undefined) {
        res.send("error1")
    } else {
        if (status == 0 || status == 1 || status == 2 || status == 3) {
            db.query('UPDATE users SET friendtotalk = ? WHERE id = ?', [status, decoded.id], async (error2, results2) => {
                res.send("done")
            })
        } else {
            res.send("error2")
        }
    }

}

exports.settheme = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { theme } = req.body;

    if (theme == undefined) {
        res.send("error1")
    } else {
        if (theme == 0 || theme == 1 || theme == 2 || theme == 3) {
            db.query('UPDATE users SET theme = ? WHERE id = ?', [theme, decoded.id], async (error2, results2) => {
                res.send("done")
            })
        } else {
            res.send("error2")
        }
    }

}


exports.customtheme = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { background_color, background_color_secondary, background_color_third, background_overbox, background_menu, line_color, line_color_secondary, general_text_color, second_text_color, third_text_color, red_text_color, blue_text_color, blue_button, button_text_color, mymessage_first_color, mymessage_second_color, mymessage_third_color, mymessage_text_color, yourmessage_first_color, yourmessage_second_color, yourmessage_third_color, yourmessage_text_color, images } = req.body;

    if (!background_color|| background_color_secondary == undefined || background_color_third == undefined || background_overbox == undefined || background_menu == undefined || line_color == undefined || line_color_secondary == undefined || general_text_color == undefined || second_text_color == undefined || third_text_color == undefined || red_text_color == undefined || blue_text_color == undefined || blue_button == undefined || button_text_color == undefined || mymessage_first_color == undefined || mymessage_second_color == undefined || mymessage_third_color == undefined || mymessage_text_color == undefined || yourmessage_first_color == undefined || yourmessage_second_color == undefined || yourmessage_third_color == undefined || yourmessage_text_color == undefined || images == undefined) {
        res.send("error1")
    } else if (background_color == null || background_color_secondary == null || background_color_third == null || background_overbox == null || background_menu == null || line_color == null || line_color_secondary == null || general_text_color == null || second_text_color == null || third_text_color == null || red_text_color == null || blue_text_color == null || blue_button == null || button_text_color == null || mymessage_first_color == null || mymessage_second_color == null || mymessage_third_color == null || mymessage_text_color == null || yourmessage_first_color == null || yourmessage_second_color == null || yourmessage_third_color == null || yourmessage_text_color == null) {
        res.send("error2")
    } else {
        if (images == 1 || images == 0) {
            db.query('SELECT id FROM custom_theme WHERE user_id = ?', [decoded.id], async (error1, results1) => {
                if (results1.length == 0) {
                    db.query('INSERT INTO custom_theme SET ?', { user_id: decoded.id, background_color: background_color, background_color_secondary: background_color_secondary, background_color_third: background_color_third, background_overbox: background_overbox, background_menu: background_menu, line_color: line_color, line_color_secondary: line_color_secondary, general_text_color: general_text_color, second_text_color: second_text_color, third_text_color: third_text_color, red_text_color: red_text_color, blue_text_color: blue_text_color, blue_button: blue_button, button_text_color: button_text_color, mymessage_first_color: mymessage_first_color, mymessage_second_color: mymessage_second_color, mymessage_third_color: mymessage_third_color, mymessage_text_color: mymessage_text_color, yourmessage_first_color: yourmessage_first_color, yourmessage_second_color: yourmessage_second_color, yourmessage_third_color: yourmessage_third_color, yourmessage_text_color: yourmessage_text_color, images: images }, (error2, results2) => {
                        res.send("done")
                    })
                } else {
                    db.query('UPDATE custom_theme SET ? WHERE user_id = ?', [{ background_color: background_color, background_color_secondary: background_color_secondary, background_color_third: background_color_third, background_overbox: background_overbox, background_menu: background_menu, line_color: line_color, line_color_secondary: line_color_secondary, general_text_color: general_text_color, second_text_color: second_text_color, third_text_color: third_text_color, red_text_color: red_text_color, blue_text_color: blue_text_color, blue_button: blue_button, button_text_color: button_text_color, mymessage_first_color: mymessage_first_color, mymessage_second_color: mymessage_second_color, mymessage_third_color: mymessage_third_color, mymessage_text_color: mymessage_text_color, yourmessage_first_color: yourmessage_first_color, yourmessage_second_color: yourmessage_second_color, yourmessage_third_color: yourmessage_third_color, yourmessage_text_color: yourmessage_text_color, images: images }, decoded.id], (error2, results2) => {
                        res.send("done")
                    })
                }
            })
        }
    }

}


function sendsocketforupdate(user_id, jwt_key) {

    // db.query('SELECT DISTINCT U.socketkey FROM users_groups UG, groups G, users U WHERE G.group_key IN (SELECT G.group_key FROM users_groups UG, groups G WHERE UG.user_id = ? AND G.id = UG.group_id) AND UG.group_id = G.id AND U.id = UG.user_id AND U.socketkey IS NOT NULL AND U.id != ?', [user_id, user_id], async (error2, results2) => {
    db.query('SELECT DISTINCT A.socketkey FROM users_groups UG, groups G, users U, accounts A WHERE G.group_key IN (SELECT G.group_key FROM users_groups UG, groups G WHERE UG.user_id = ? AND G.id = UG.group_id) AND UG.group_id = G.id AND U.id = UG.user_id AND A.socketkey IS NOT NULL AND A.jwt_key != ? AND A.user_id = U.id', [user_id, jwt_key], async (error2, results2) => {

        // db.query('SELECT U.socketkey FROM users U, friends F WHERE ((F.reciver = 2 AND F.sender = U.id) OR (F.sender = 2 AND F.reciver = U.id)) AND U.socketkey IS NOT null', [user_id, user_id], async (error3, results3) => {
        db.query('SELECT A.socketkey FROM users U, friends F, accounts A WHERE ((F.reciver = ? AND F.sender = U.id) OR (F.sender = ? AND F.reciver = U.id)) AND A.socketkey IS NOT null AND A.user_id = U.id UNION SELECT A.socketkey FROM users U, accounts A WHERE A.socketkey IS NOT null AND A.user_id = ? AND A.jwt_key != ?', [user_id, user_id, user_id, jwt_key], async (error3, results3) => {
            console.log(error3)

            let finallist = [];
            if (results2.length != 0 && results3.length == 0) {
                finallist = simplesocketkeylist(results2)
            } else if (results2.length == 0 && results3.length != 0) {
                finallist = simplesocketkeylist(results3)
            } else if (results2.length != 0 && results3.length != 0) {
                finallist = removeDuplicates(simplesocketkeylist(results2), simplesocketkeylist(results3))
            } else if (results2.length == 0 && results3.length == 0) {
                finallist = simplesocketkeylist(results2)
            }

            finallist.forEach(element => {
                io.to(element).emit("friends:update", {
                    id: user_id
                });
            })

        })
    });
}

function simplesocketkeylist(list) {
    let newlist = [];
    list.forEach(element => {
        newlist.push(element.socketkey)
    })
    return newlist;
}

