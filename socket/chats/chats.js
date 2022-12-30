const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone, getFilesizeInBytes, formatBytes } = require('../../controllers/functions');
const cookie = require('cookie');
const Sequelize = require("sequelize");
const Cryptr = require('cryptr');
const webpush = require("web-push");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { io } = require('../../index');

const { getdecoded } = require('../../controllers/getdecoded');



// On se connecte à la base
// const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
//     host: process.env.DATABASE_HOST,
//     dialect: "mysql",
//     logging: false
// });

// On charge le model chat
// const Chat = require("../../Models/Chat")(sequelize, Sequelize.DataTypes);

// On effectue le chargement réel 
// Chat.sync();

io.on("connection", async (socket) => {

    const decoded = await getdecoded(cookie.parse(socket.handshake.headers.cookie).jwt);

    // On gère le chat (dans le back)
    socket.on("chats:send_message", (args, callback) => {
        // args.group_key
        // args.reply
        // args.message
        // args.attachedfiles

        db.query('SELECT UG.user_id, G.id, G.group_key, G.key_image, G.group_name FROM users_groups UG, groups G WHERE G.group_key = ? AND UG.group_id = G.id', [args.group_key], (error1, result1) => {
            if (result1.length == 0 || !result1.filter(function (e) { return e.user_id == decoded.id; }).length > 0) {

                io.to(socket.id).emit("warn", {
                    text: "Tu me prends pour un teubé ? On a un minimum sécurisé le truc bg."
                });
            } else {
                if (args.message.replace(/^\s\n+|\s\n+$/g, '').replaceAll(" ", "").replaceAll("&nbsp;", "") != "") {
                    let message_key = random_str(25)
                    let pre_final_reply;
                    let final_reply;
                    let final_message = '';
                    let final_attachedfiles = 0;
                    let pre_final_attachedfiles_files;

                    db.query('SELECT message_key FROM messages', [], (error3, result3) => {

                        for (let i = 0; i < 1;) {
                            if (JSON.stringify(result3).includes(message_key)) {
                                message_key = random_str(25);
                            } else { i = 1; }
                        }

                        final_message = args.message.replace(/^\s\n+|\s\n+$/g, '').replaceAll('<', '&lt;').replaceAll('>', '&gt;')

                        // verif reply | good
                        // upload le msg | good
                        // add les attachments dans la db 'files' | not good

                        if (args.reply != null) {
                            db.query('SELECT M.message_key, M.user_id, M.text, U.name, U.surname, U.public_uuid FROM messages M, users U WHERE M.message_key = ? AND U.id = M.user_id', [args.reply], (error4, result4) => {

                                if (result4 != undefined && result4 != null && result4.length != 0) {
                                    pre_final_reply = result4[0];
                                } else {
                                    pre_final_reply = null;
                                }

                            });
                        }


                        // INSERT INTO projects(name, start_date, end_date) VALUES ('AI for Marketing','2019-08-01','2019-12-31'), ('ML for Sales','2019-05-15','2019-11-20');
                        // SELECT * FROM attachments WHERE storage_name = ? OR storage_name = ?

                        if (args.attachedfiles != null && args.attachedfiles.length != 0) {


                            let final_sql = "";
                            let i = 0;
                            args.attachedfiles.forEach(element => {
                                if (i == 0) {
                                    final_sql += "storage_name = '" + element + "'"
                                } else {
                                    final_sql += " OR storage_name = '" + element + "'"
                                }
                                i++;
                            });

                            db.query("SELECT * FROM attachments WHERE " + final_sql, [], (error5, results5) => {

                                if (results5 != null && results5.length == args.attachedfiles.length) {

                                    final_attachedfiles = 1;

                                    pre_final_attachedfiles_files = results5;
                                }


                            });

                        }

                        setTimeout(() => {
                            db.query('SELECT name, avatar FROM users WHERE id = ? ', [decoded.id], (e, r) => {

                                let encrypted = new Cryptr(result1[0].group_key).encrypt(final_message)

                                db.query("INSERT INTO messages SET ?", { group_id: result1[0].id, user_id: decoded.id, text: encrypted, message_key: message_key, attachedfile: final_attachedfiles, reply: final_reply }, (error4, results4) => {

                                    if (final_attachedfiles != 0) {
                                        const sql_values = [];

                                        args.attachedfiles.forEach(element => {
                                            sql_values.push([results4.insertId, element])
                                        });

                                        db.query("INSERT INTO files(message_id, path) VALUES ?", [sql_values], (error6, results6) => { });
                                    }


                                });


                                // --------------------------------------------------------------------------------------------------------
                                // --------------------------------------------- SOCKET ---------------------------------------------------
                                // --------------------------------------------------------------------------------------------------------

                                // pre_final_reply

                                if (pre_final_reply != null) {
                                    final_reply = {
                                        name: pre_final_reply.name,
                                        surname: pre_final_reply.surname,
                                        user_uuid: pre_final_reply.public_uuid,
                                        messageuuid: pre_final_reply.message_key,
                                        message: pre_final_reply.text
                                    };
                                } else {
                                    final_reply = null;
                                }
                                // AND A.socketkey IS NOT NULL
                                db.query('SELECT DISTINCT A.socketkey, A.user_id, A.webpush_endpoint, A.webpush_key_p256dh, A.webpush_key_auth FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result1[0].id], async (error4, results4) => {

                                    if (results4 != null || results4.length != 0) {

                                        const final_attachedfiles_files = [];

                                        if (final_attachedfiles != 0) {
                                            pre_final_attachedfiles_files.forEach(element => {

                                                if (["png", "gif", "jpeg", "jpg", "png", "webp", "tif", "tiff"].includes(element.extension)) {
                                                    final_attachedfiles_files.push({
                                                        link: "/attachemnt/download/" + element.owner_uuid + "/" + element.storage_name,
                                                        name: element.name,
                                                        image: 1,
                                                        type: element.extension
                                                    })
                                                } else {
                                                    final_attachedfiles_files.push({
                                                        link: "/attachemnt/download/" + element.owner_uuid + "/" + element.storage_name,
                                                        name: element.name,
                                                        image: 0,
                                                        type: element.extension
                                                    })
                                                }
                                            });
                                        }


                                        results4.forEach(element => {
                                            const notif = {
                                                title: 'WhatsWeb',
                                                options: {
                                                    body: result1[0].key_image ? `${r[0].name} à ${result1[0].group_name} : ${final_message.slice(0, 50)}` : `${r[0].name} à vous : ${final_message.slice(0, 50)}`,
                                                    icon: result1[0].key_image ? result1[0].key_image : r[0].avatar,
                                                    timestamp: new Date(Date.now()).toString(),
                                                    data: {
                                                        url: `https://beta.whatsweb.fr/?group=${result1[0].group_key}`
                                                    }
                                                }
                                            }
                                            if (element.socketkey) {
                                                io.to(element.socketkey).emit("chats:receive_message", {
                                                    group_key: args.group_key,
                                                    messageuuid: message_key,
                                                    author: decoded.id,
                                                    reply: final_reply,
                                                    message: final_message,
                                                    senddate: Date.now(),
                                                    attachedfiles: final_attachedfiles_files,
                                                    notif: notif
                                                });
                                            } else if (element.webpush_endpoint && element.webpush_key_p256dh && element.webpush_key_auth) {
                                                try {
                                                    webpush.sendNotification({
                                                        endpoint: element.webpush_endpoint,
                                                        // endpoint: 'https://fcm.googleapis.com/fcm/send/c3IaQU97f8c:APA91bGxirhSdP6Om_QfDzwFdSRMKIsP1P71um3vgmNmxPDVgpuGbJc1xJqiCaV2MaBmGwUBQXdPkoMe5WfE93bs2yjuQM24gZ19SPwWL3maW93KXlVWEuxucRKe1w3BGBSPff_Yrjfg',
                                                        expirationTime: 3 * 24 * 60 * 60 * 1000,
                                                        keys: {
                                                            p256dh: element.webpush_key_p256dh,
                                                            auth: element.webpush_key_auth
                                                        }
                                                    }, JSON.stringify(notif));
                                                } catch (error) {

                                                }
                                            }
                                        });

                                        try {
                                            callback({
                                                status: "done"
                                            });
                                        } catch (error) {
                                            console.log(error);
                                        }

                                    }
                                });

                                // --------------------------------------------------------------------------------------------------------
                                // --------------------------------------------- SOCKET ---------------------------------------------------
                                // --------------------------------------------------------------------------------------------------------
                            });
                        }, 50);
                    });
                } else {
                    io.to(socket.id).emit("warn", {
                        text: "Tu me prends pour un teubé ? On a un minimum sécurisé le truc bg."
                    });
                }

                // console.log(args);
            }
        });

    });

});
