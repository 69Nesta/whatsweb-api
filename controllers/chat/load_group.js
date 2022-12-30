const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone, removeDuplicates, getphonenumber, getavatar, getstatus } = require('../functions');
const cookie = require('cookie');
const Cryptr = require('cryptr');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { getdecoded } = require('../getdecoded');


let imagesextensions = ["apng", "png", "avif", "gif", "jpeg", "jpg", "png", "webp", "tif", "tiff"]

exports.load_group = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const { group_key } = req.body;

    // db.query('SELECT socketkey FROM users WHERE id = ', [id], (error1, result1) => {
    //  UG.user_id,G.isgroup,G.group_name,G.key_image
    db.query('SELECT G.isgroup,G.group_key,G.group_name,G.lastmessagesee,G.key_image,U.name,U.public_uuid,U.mail,U.avatar,U.surname,G.id AS group_id,U.id,U.phone,U.public_status,U.public_avatar,U.public_phone, UNIX_TIMESTAMP(U.der_date) AS der_date, UNIX_TIMESTAMP(G.group_date) AS group_date, UG.user_perm, UG.notifications FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
        if (result4 == undefined || !result4.length > 0) {
            // console.log(result4, !result4.length > 0);
            return res.send('error3');
        }

        if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
            return res.send('error2');
        }

        const members = [];

        let counter1 = result4.length;

        result4.forEach(element => {
            db.query('SELECT * FROM friends WHERE (sender = ? AND reciver = ?) OR (sender = ? AND reciver = ?)', [element.id, decoded.id, decoded.id, element.id], (errorfr, resultfr) => {
                db.query('SELECT * FROM users_blockeds WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)', [element.id, decoded.id, decoded.id, element.id], async (errorb, resultb) => {
                    if (resultb.length == 0) {

                        let avatar = getavatar(element, resultfr)
                        if (avatar == undefined) {
                            avatar = "/img/default.svg"
                        }

                        members.push({
                            id: element.id,
                            uuid: element.public_uuid,
                            name: element.name,
                            surname: element.surname,
                            phone: getphonenumber(element, resultfr),
                            email: element.mail,
                            avatar: avatar,
                            online: await getstatus(element, resultfr),
                            user_perm: element.user_perm
                        })
                    } else {
                        members.push({
                            id: element.id,
                            uuid: element.public_uuid,
                            name: element.name,
                            surname: element.surname,
                            phone: null,
                            email: element.mail,
                            avatar: "/img/default.svg",
                            online: null,
                            user_perm: element.user_perm
                        })
                    }

                    counter1 -= 1;

                    if (counter1 == 0) {

                        db.query('SELECT id, UNIX_TIMESTAMP(date_accepted) AS date_accepted FROM friends WHERE accepted = 1 AND (sender = ? AND reciver = ?) OR (sender = ? AND reciver = ?)', [members[1].id, members[0].id, members[0].id, members[1].id], (errord, resultD) => {

                            let adddate = result4[0].group_date
                            let friendid = null;

                            if (result4[0].isgroup == 0 && resultD != 0) {
                                adddate = resultD[0].date_accepted
                                friendid = resultD[0].id;
                            } else if (result4[0].isgroup == 0 && resultD == 0) {
                                friendid = 0;
                            }

                            db.query('SELECT id, group_id, user_id, text, message_key,attachedfile,reply, UNIX_TIMESTAMP(date_update) AS date_update, UNIX_TIMESTAMP(date_creation) AS date_creation FROM messages WHERE group_id = ? ORDER BY date_creation DESC LIMIT 20 ', [result4[0].group_id], (error1, result1) => {

                                var counter = result1.length;
                                const returnmessages = [];
                                if (counter == 0) {
                                    const returnjson = {
                                        discuss: {
                                            group_id: result4[0].group_id,
                                            isgroup: result4[0].isgroup,
                                            group_key: result4[0].group_key,
                                            group_name: result4[0].group_name,
                                            group_image: result4[0].key_image,
                                            lastmessagesee: result4[0].lastmessagesee,
                                            creationdate: adddate,
                                            friendid: friendid,
                                            notifs: result4[0].notifications,
                                            members: members
                                        },
                                        messages: returnmessages
                                    }

                                    return res.send(returnjson);
                                } else {
                                    result1.forEach(element => {
                                        let reply;
                                        let files = 0;
                                        db.query('SELECT M.text,M.message_key,U.name,U.surname FROM messages M, users U WHERE M.group_id = ? AND M.id = ? AND U.id = M.user_id', [result4[0].group_id, element.reply], (error2, result2) => {
                                            db.query('SELECT A.extension,A.name,F.path FROM attachments A, files F WHERE F.message_id = ? AND F.path = CONCAT("/attachments/download/", A.owner_uuid, "/", A.storage_name)', [element.id], (error3, result3) => {
                                                if (element.reply != null && result2 != null && result2 != 0) {
                                                    reply = {
                                                        name: result2[0].name + " " + result2[0].surname,
                                                        message: result2[0].text,
                                                        messageuuid: result2[0].message_key
                                                    }
                                                }
                                                if (element.attachedfile != 0 && result3 != null && result3 != 0) {
                                                    files = [];
                                                    result3.forEach(element2 => {
                                                        let isimage = 0;
                                                        if (imagesextensions.includes(element2.extension)) {
                                                            isimage = 1;
                                                        }
                                                        files.push({
                                                            key: element2.path,
                                                            name: element2.name,
                                                            type: element2.extension,
                                                            image: isimage
                                                        })
                                                    })
                                                }


                                                let decrypted = new Cryptr(result4[0].group_key).decrypt(element.text)

                                                returnmessages.push({
                                                    message_uuid: element.message_key,
                                                    author: element.user_id,
                                                    reply: reply,
                                                    message: decrypted.replaceAll("\n", "<br>"),
                                                    senddate: element.date_creation,
                                                    attachedfiles: files
                                                });

                                                counter -= 1;
                                                if (counter === 0) {
                                                    const returnjson = {
                                                        discuss: {
                                                            group_id: result4[0].group_id,
                                                            isgroup: result4[0].isgroup,
                                                            group_key: result4[0].group_key,
                                                            group_name: result4[0].group_name,
                                                            group_image: result4[0].key_image,
                                                            lastmessagesee: result4[0].lastmessagesee,
                                                            creationdate: adddate,
                                                            friendid: friendid,
                                                            notifs: result4[0].notifications,
                                                            members: members
                                                        },
                                                        messages: returnmessages
                                                    }

                                                    return res.send(returnjson);
                                                }
                                            });
                                        });
                                    });
                                }
                            });
                        })
                    }

                })
            })
        });
    });
}

exports.getcommongroups = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { user_id } = req.body;

    if (user_id == undefined) {
        res.send("error1")
    } else {
        db.query('SELECT G.group_key,G.id,G.key_image,G.group_name FROM users_groups UG, groups G WHERE G.id = UG.group_id AND UG.user_id = ? AND G.isgroup = 1 INTERSECT SELECT G.group_key,G.id,G.key_image,G.group_name FROM users_groups UG, groups G WHERE G.id = UG.group_id AND UG.user_id = ? AND G.isgroup = 1', [decoded.id, user_id], (error1, result1) => {
            let counter = result1.length;
            if (counter == 0) {
                res.send("error2")
            } else {
                let final = [];
                result1.forEach(element => {
                    let names = "Vous";

                    db.query('SELECT U.name,U.id FROM users U, users_groups UG WHERE UG.user_id = U.id AND UG.group_id = ?', [element.id], (error2, result2) => {

                        result2.forEach(element2 => {
                            if (element2.id != decoded.id) {
                                names = names + ", " + element2.name
                            }
                        })

                        final.push({
                            group_key: element.group_key,
                            key_image: element.key_image,
                            group_name: element.group_name,
                            names: names
                        })

                        counter -= 1;
                        if (counter === 0) {
                            return res.send(final);
                        }
                    })
                })
            }
        })
    }
}