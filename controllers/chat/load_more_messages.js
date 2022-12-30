const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const Cryptr = require('cryptr');

const { getdecoded } = require('../getdecoded');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.load_more_messages = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { row, group_key } = req.body;

    if (row < 20) {
        return res.send('error');
    }

    db.query('SELECT G.isgroup,G.group_key,G.group_name,G.lastmessagesee,G.key_image,U.name,U.public_uuid,U.mail,U.avatar,U.surname,G.id AS group_id,U.id,U.phone,U.public_status,U.public_avatar,U.public_phone, UNIX_TIMESTAMP(U.der_date) AS der_date, UNIX_TIMESTAMP(G.group_date) AS group_date, UG.user_perm, UG.notifications FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
        if (result4 == undefined || !result4.length > 0) {
            return res.send('error');
        }

        if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
            return res.send('error');
        }

        db.query('SELECT id, group_id, user_id, text, message_key, attachedfile, reply, UNIX_TIMESTAMP(date_update) AS date_update, UNIX_TIMESTAMP(date_creation) AS date_creation FROM messages WHERE group_id = ? ORDER BY date_creation DESC LIMIT 20 OFFSET ?', [result4[0].group_id, parseInt(row)], (error1, result1) => {

            if (!result1) {
                return res.send('error')
            }

            let counter = result1.length;
            const returnmessages = [];
            if (counter == 0) {
                return res.send({messages: returnmessages, isgroup: result4[0].isgroup, discuss: { group_key: result4[0].group_key }});
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
                                return res.send({messages: returnmessages, isgroup: result4[0].isgroup, discuss: { group_key: result4[0].group_key }});
                            }
                        });
                    });
                });
            }
        });
    });



}