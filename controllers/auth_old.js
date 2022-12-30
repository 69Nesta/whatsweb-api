const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
let nodemailer = require('nodemailer');
const Cryptr = require('cryptr');
const DeviceDetector = require("device-detector-js");


const { getdecoded } = require('./getdecoded');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.isLoggedIn = async (req, res, next) => {

    let start = Date.now();
    // console.log(req.cookies);
    if (req.cookies.jwt) {
        try {
            //1) verify the token
            const decoded = await getdecoded(req.cookies.jwt);

            if(decoded.id == 0) {
                res.cookie('jwt', 'logout', {
                    expires: new Date(Date.now() + 2 * 1000),
                    httpOnly: true
                });
                return next();
            }
            
            //2) Check if the user still exists
            db.query('SELECT id,name,surname,avatar,mail,phone,UNIX_TIMESTAMP(creationdate) AS creationdate,theme,public_status,friendtotalk,public_phone,public_avatar,email_confirmed,checkbuttontheme FROM users WHERE id = ?', [decoded.id], (error, result) => {
                if (!result) {
                    return next();
                } 
                if (result[0].email_confirmed == 0) {
                    req.notconfirmed = result[0].mail
                    return next();
                } else {
                
                    db.query('SELECT id,sender,reciver,accepted FROM friends WHERE sender = ? OR reciver = ?', [decoded.id, decoded.id], (error1, result1) => {

                        let suite_sql = '';
                        let liste_friends = [];
                        let i = 0;

                        result1.forEach(element => {
                            if (element.sender != decoded.id) {
                                if (i == 0) {
                                    suite_sql += 'id = ' + element.sender;
                                } else {
                                    suite_sql += ' OR id = ' + element.sender;
                                }
                                liste_friends.push({ id_table: element.id, id: element.sender, accepted: element.accepted, reciver: element.reciver })
                            } else {
                                if (i == 0) {
                                    suite_sql += 'id = ' + element.reciver;
                                } else {
                                    suite_sql += ' OR id = ' + element.reciver;
                                }
                                liste_friends.push({ id_table: element.id, id: element.reciver, accepted: element.accepted, reciver: element.reciver })
                            }
                            i = 1;
                        });
                        i = 0;

                        db.query(`SELECT id,avatar,name,surname,mail,public_uuid FROM users WHERE ${suite_sql}`, [], (error2, result2) => {
                            let request_friends = [];
                            let refused_friends = [];
                            let friends = [];

                            let map = {}
                            for (let i = 0; i < liste_friends.length; i++) {
                                map[liste_friends[i].id] = liste_friends[i]
                            }

                            if (result2 != undefined) {
                                result2.forEach(element => {
                                    let element2 = {};
                                    if (map[element.id].accepted == 0 && map[element.id].reciver == decoded.id) {
                                        element2 = element;
                                        element2.friends_id = map[element.id].id_table;
                                        // console.log(element2);
                                        request_friends.push(element2);
                                    } else if (map[element.id].accepted == 1) {
                                        element2 = element;
                                        element2.friends_id = map[element.id].id_table;
                                        friends.push(element2);
                                    } else if (map[element.id].accepted == 2) {
                                        element2 = element;
                                        element2.friends_id = map[element.id].id_table;
                                        refused_friends.push(element);
                                    }
                                });
                            }

                            db.query('SELECT * FROM custom_theme WHERE user_id = ?', [decoded.id], async (errorT, resultsT) => {

                                let customtheme = resultsT[0]

                                if (resultsT.length == 0) {
                                    customtheme = {
                                        background_color: "#ffffff",
                                        background_color_secondary: "#f1f1f1",
                                        background_color_third: "#dddddd",
                                        background_overbox: "#ededed",
                                        background_menu: "#ffffff",
                                        line_color: "#707070",
                                        line_color_secondary: "#cecece",
                                        general_text_color: "#212529",
                                        second_text_color: "#272121",
                                        third_text_color: "#616161",
                                        red_text_color: "#ea0038",
                                        blue_text_color: "#2888b9",
                                        blue_button: "#4dbecf",
                                        button_text_color: "#ffffff",
                                        mymessage_first_color: "#2ea0d9",
                                        mymessage_second_color: "#2888b9",
                                        mymessage_third_color: "#005c89",
                                        mymessage_text_color: "#ffffff",
                                        yourmessage_first_color: "#d8d9d9",
                                        yourmessage_second_color: "#c3c3c3",
                                        yourmessage_third_color: "#9b9b9b",
                                        yourmessage_text_color: "#000000",
                                        images: 0
                                    }
                                }

                                db.query('SELECT devices, UNIX_TIMESTAMP(der_date) AS der_date, der_ip, id FROM accounts WHERE user_id = ?', [decoded.id], async (error9, result9) => {

                                    let connectedDevices = []

                                    const deviceDetector = new DeviceDetector();

                                    result9.forEach(element => {
                                        const userAgent = element.devices;
                                        const device = deviceDetector.parse(userAgent);

                                        connectedDevices.push({
                                            device: device,
                                            deviceString: JSON.stringify(device),
                                            ip: element.der_ip,
                                            date: element.der_date,
                                            id: element.id
                                        })
                                    })

                                    db.query('SELECT G.id, G.isgroup, G.group_name, G.group_key, G.key_image, G.group_date, UNIX_TIMESTAMP(G.group_date) AS lastmessagedate, G.lastmessagetext FROM users_groups UG, groups G WHERE UG.user_id = ? AND UG.visible = 1 AND G.id = UG.group_id ORDER BY G.lastmessagedate DESC', [decoded.id], async (error8, result8) => {
                                        if (result8 != undefined) {

                                            function getTousLesTrucsPromise(element) {
                                                return new Promise(async (resolve, reject) => {

                                                    db.query("SELECT M.user_id, M.text, UNIX_TIMESTAMP(M.date_creation) AS date_creation FROM messages M, users U WHERE M.group_id = ? ORDER BY M.date_creation DESC LIMIT 1", [element.id], (errorlm, resultlm) => {

                                                        if (resultlm != undefined && resultlm != 0) {
                                                            element.lastmessagedate = resultlm[0].date_creation
                                                            let decrypted = new Cryptr(element.group_key).decrypt(resultlm[0].text)
                                                            if(decrypted == "%start%" && resultlm[0].user_id == null) {
                                                                if(element.isgroup == 0) {
                                                                    element.lastmessagetext = "Nouvelle discussion"
                                                                } else {
                                                                    element.lastmessagetext = "Nouveau groupe"
                                                                }
                                                            } else {
                                                                element.lastmessagetext = decrypted
                                                            }
                                                        }

                                                        if (element.isgroup == 0) {
                                                            db.query(`SELECT user_id FROM users_groups WHERE group_id = ?`, [element.id], (error9, result9) => {

                                                                let id_user = result9[1].user_id;

                                                                if (result9[0].user_id != decoded.id) {
                                                                    id_user = result9[0].user_id;
                                                                }

                                                                if (resultlm != undefined && resultlm != 0) {

                                                                    let decrypted = new Cryptr(element.group_key).decrypt(resultlm[0].text)
                                                                    if(decrypted == "%start%" && resultlm[0].user_id == null) {
                                                                        element.lastmessagetext = "Nouvelle discussion"
                                                                    } else {
                                                                        element.lastmessagetext = decrypted
                                                                    }
                                                                    
                                                                }

                                                                db.query(`SELECT name,avatar,surname FROM users WHERE id = ?`, [id_user], (error10, result10) => {
                                                                    element.group_name = result10[0].name + " " + result10[0].surname;
                                                                    element.key_image = result10[0].avatar;

                                                                    resolve(element)
                                                                });

                                                            })
                                                        } else {
                                                            if (resultlm != undefined && resultlm != 0) {
                                                                if (resultlm[0].user_id != decoded.id && resultlm[0].user_id != null) {
                                                                    db.query(`SELECT name FROM users WHERE id = ?`, [resultlm[0].user_id], (error10, result10) => {
                                                                        let decrypted = new Cryptr(element.group_key).decrypt(resultlm[0].text)
                                                                        
                                                                        if(decrypted == "%start%" && result10 == 0) {
                                                                            element.lastmessagetext = "Nouveau groupe"
                                                                        } else {
                                                                            element.lastmessagetext = result10[0].name + " : " + decrypted;
                                                                        }

                                                                        resolve(element)
                                                                    });
                                                                } else {
                                                                    resolve(element)
                                                                }
                                                            } else {
                                                                resolve(element)
                                                            }
                                                        }
                                                    })

                                                })
                                            }

                                            async function processLeTruc() {
                                                let id = 0;
                                                let result8final = [];
                                                while (id < result8.length) {
                                                    let data = await getTousLesTrucsPromise(result8[id]);

                                                    result8final.push(data);
                                                    id += 1;
                                                }
                                                return result8final.sort(function (a, b) {
                                                    return a.lastmessagedate - b.lastmessagedate;
                                                });
                                            }

                                            result8 = await processLeTruc()

                                            req.groups = result8.reverse();
                                            req.request_friends = request_friends;
                                            req.refused_friends = refused_friends;
                                            req.friends = friends;
                                            req.user = result[0];
                                            req.start = start;
                                            req.customtheme = customtheme;
                                            req.connectedDevices = connectedDevices;

                                            let ip;
                                            try {
                                                ip = req.socket.remoteAddress.split('::ffff:')[1];
                                                if (ip == undefined) { ip = 'introuvable'; }
                                            } catch {
                                                ip = 'error';
                                            }


                                            db.query('UPDATE users SET der_ip = ?, der_date = ? WHERE id = ?', [ip, new Date(), decoded.id], (error5, result5) => { });

                                            console.log({ milli_second: Date.now() - start });

                                            return next();
                                        } else {
                                            req.request_friends = request_friends;
                                            req.refused_friends = refused_friends;
                                            req.friends = friends;
                                            req.user = result[0];
                                            req.groups = null;
                                            req.customtheme = customtheme;
                                            req.connectedDevices = connectedDevices;

                                            let ip;
                                            try {
                                                ip = req.socket.remoteAddress.split('::ffff:')[1];
                                                if (ip == undefined) { ip = 'introuvable'; }
                                            } catch {
                                                ip = 'error';
                                            }


                                            db.query('UPDATE users SET der_ip = ?, der_date = ? WHERE id = ?', [ip, new Date(), decoded.id], (error5, result5) => { });

                                            return next();
                                        }
                                    });

                                })

                            })


                        });

                    });
                }

            });
        } catch (error) {
            console.log(error);
            // console.log('error cookies auth.js l:95');
            return next();
        }
    } else {
        next();
    }
}