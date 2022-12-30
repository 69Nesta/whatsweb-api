const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail } = require('./mail');
const { random_str, validateEmail, validatePhone, removeDuplicates } = require('../functions');

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

    const { name, surname, email, phone, user_uuid, storage_name, status, public_avatar, public_phone, friendtotalk, theme } = req.body;

    db.query('SELECT mail FROM users WHERE mail = ?', [email], async (error, results) => {

        db.query('SELECT mail,name,phone,surname,mail_verif_uuid FROM users WHERE id = ?', [decoded.id], async (error1, results1) => {

            let hasBeenModified = {}

            if (name && name != results1[0].name) {
                if (name.replaceAll(' ', '').length > 3)
                    hasBeenModified.name = name

                else
                    return res.json({ error: 7 })
            }

            if (surname && surname != results1[0].surname) {
                hasBeenModified.surname = surname.replaceAll(' ', '').length ? surname : null
            }

            if (email && email != results1[0].mail) {
                if (!email.replaceAll(' ', '').length > 0 || !validateEmail(email))
                    return res.json({ error: 5 })

                else if (!results.length > 0) {
                    hasBeenModified.mail = email
                    hasBeenModified.email_confirmed = 0
                }

                else
                    return res.json({ error: 6 })
            }

            if (phone && phone != results1[0].phone) {
                if (phone.replaceAll(' ', '') == "")
                    hasBeenModified.phone = null

                else if (validatePhone(phone))
                    hasBeenModified.phone = phone

                else
                    return res.json({ error: 8 })
            }

            if (user_uuid && storage_name.length == 50 && `/attachments/download/${user_uuid}/${storage_name}` != results1[0].avatar) {
                hasBeenModified.avatar = `/attachments/download/${user_uuid}/${storage_name}`
            }

            if (status && status != results1[0].status) {
                if (status == 0 || status == 1 || status == 2)
                    hasBeenModified.public_status = status

                else
                    return res.json({ error: 2 })

            }

            if (public_avatar && public_avatar != results1[0].public_avatar) {
                if (public_avatar == 0 || public_avatar == 1)
                    hasBeenModified.public_avatar = public_avatar

                else
                    return res.json({ error: 2 })

            }

            if (public_phone && public_phone != results1[0].public_phone) {
                if (public_phone == 0 || public_phone == 1)
                    hasBeenModified.public_phone = public_phone

                else
                    return res.json({ error: 2 })

            }

            if (friendtotalk && friendtotalk != results1[0].friendtotalk) {
                if (friendtotalk == 0 || friendtotalk == 1 || friendtotalk == 2 || friendtotalk == 3)
                    hasBeenModified.friendtotalk = friendtotalk

                else
                    return res.json({ error: 2 })

            }

            if (theme && theme != results1[0].theme) {
                if (theme == 0 || theme == 1 || theme == 2 || theme == 3) {
                    hasBeenModified.theme = theme

                } else {
                    return res.json({ error: 2 })
                }
            }



            if (hasBeenModified.mail) {
                sendmail(email, results1[0].mail_verif_uuid)
            }

            db.query('UPDATE users SET ? WHERE ?', [{ ...hasBeenModified }, { id: decoded.id }], async (error2, results2) => { })

            if (hasBeenModified) {
                sendsocketforupdate(decoded.id, decoded.jwt_key, hasBeenModified)
                return res.json({ error: false })
            }
        });
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

exports.customtheme = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { background_color, background_color_secondary, background_color_third, background_overbox, background_menu, line_color, line_color_secondary, general_text_color, second_text_color, third_text_color, red_text_color, blue_text_color, blue_button, button_text_color, mymessage_first_color, mymessage_second_color, mymessage_third_color, mymessage_text_color, yourmessage_first_color, yourmessage_second_color, yourmessage_third_color, yourmessage_text_color, images } = req.body;

    if (!background_color || !background_color_secondary || !background_color_third || !background_overbox || !background_menu || !line_color || !line_color_secondary || !general_text_color || !second_text_color || !third_text_color || !red_text_color || !blue_text_color || !blue_button || !button_text_color || !mymessage_first_color || !mymessage_second_color || !mymessage_third_color || !mymessage_text_color || !yourmessage_first_color || !yourmessage_second_color || !yourmessage_third_color || !yourmessage_text_color || !images) {
        return res.json({ error: 2 })
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


function sendsocketforupdate(user_id, jwt_key, hasBeenModified) {
    db.query('SELECT DISTINCT A.socketkey FROM users_groups UG, groups G, users U, accounts A WHERE G.group_key IN (SELECT G.group_key FROM users_groups UG, groups G WHERE UG.user_id = ? AND G.id = UG.group_id) AND UG.group_id = G.id AND U.id = UG.user_id AND A.socketkey IS NOT NULL AND A.jwt_key != ? AND A.user_id = U.id', [user_id, jwt_key], async (error2, results2) => {

        db.query('SELECT A.socketkey FROM users U, friends F, accounts A WHERE ((F.reciver = ? AND F.sender = U.id) OR (F.sender = ? AND F.reciver = U.id)) AND A.socketkey IS NOT null AND A.user_id = U.id UNION SELECT A.socketkey FROM users U, accounts A WHERE A.socketkey IS NOT null AND A.user_id = ? AND A.jwt_key != ?', [user_id, user_id, user_id, jwt_key], async (error3, results3) => {

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
                    id: user_id,
                    update: hasBeenModified
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