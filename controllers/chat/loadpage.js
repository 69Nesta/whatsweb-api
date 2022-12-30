const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail, sendmailforgotpassword } = require('./mail');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone } = require('../functions');
const { getdecoded } = require('../getdecoded');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


exports.loadpage = async (req, res) => {

    let start = Date.now();

    const decoded = await getdecoded(req.cookies.jwt);

    if (decoded.id != 0) {

        const decoded = await promisify(jwt.verify)(req.cookies.jwt,
            process.env.JWT_SECRET
        );
        getdecoded()


        //2) Check if the user still exists
        db.query('SELECT id,name,surname,avatar,mail,phone,UNIX_TIMESTAMP(creationdate) AS creationdate,theme,public_status,friendtotalk,public_phone,public_avatar FROM users WHERE id = ?', [decoded.id], (error, result) => {

            if (!result) {
                return;
            }

            db.query('SELECT id,sender,reciver,accepted FROM friends WHERE sender = ? OR reciver = ?', [decoded.id, decoded.id], (error1, result1) => {
                // console.log(result1);
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

                    var map = {}
                    for (var i = 0; i < liste_friends.length; i++) {
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

                        db.query('SELECT G.id, G.isgroup, G.group_name, G.group_key, G.key_image, G.group_date, UNIX_TIMESTAMP(G.group_date) AS lastmessagedate, G.lastmessagetext FROM users_groups UG, groups G WHERE UG.user_id = ? AND UG.visible = 1 AND G.id = UG.group_id ORDER BY G.lastmessagedate DESC', [decoded.id], (error8, result8) => {
                            if (result8 != undefined) {
                                result8.forEach(element => {
                                    db.query("SELECT M.user_id, M.text, UNIX_TIMESTAMP(M.date_creation) AS date_creation FROM messages M, users U WHERE M.group_id = ? ORDER BY M.date_creation DESC LIMIT 1", [element.id], (errorlm, resultlm) => {

                                        if (resultlm != undefined && resultlm != 0) {
                                            element.lastmessagedate = resultlm[0].date_creation
                                            element.lastmessagetext = resultlm[0].text
                                        }

                                        if (element.isgroup == 0) {
                                            db.query(`SELECT user_id FROM users_groups WHERE group_id = ?`, [element.id], (error9, result9) => {

                                                let id_user = result9[1].user_id;

                                                if (result9[0].user_id != decoded.id) {
                                                    id_user = result9[0].user_id;
                                                }
                                                db.query(`SELECT name,avatar,surname FROM users WHERE id = ?`, [id_user], (error10, result10) => {
                                                    element.group_name = result10[0].name + " " + result10[0].surname;
                                                    element.key_image = result10[0].avatar;
                                                });

                                                if (resultlm != undefined && resultlm != 0) {
                                                    element.lastmessagetext = resultlm[0].text
                                                }

                                            })
                                        } else {
                                            if (resultlm != undefined && resultlm != 0) {
                                                if (resultlm[0].user_id != decoded.id && resultlm[0].user_id != null) {
                                                    db.query(`SELECT name FROM users WHERE id = ?`, [resultlm[0].user_id], (error10, result10) => {
                                                        element.lastmessagetext = result10[0].name + " : " + resultlm[0].text;
                                                    });
                                                }
                                            }
                                        }
                                    })

                                });

                                result8 = result8.sort(function (a, b) {
                                    return a.lastmessagedate - b.lastmessagedate;
                                });

                                setTimeout(() => {

                                    return res.send({
                                        groups: result8,
                                        request_friends: request_friends,
                                        refused_friends: refused_friends,
                                        friends: friends,
                                        user: result[0],
                                        customtheme: customtheme
                                    })

                                }, 100);
                            } else {

                                return res.send({
                                    groups: null,
                                    request_friends: request_friends,
                                    refused_friends: refused_friends,
                                    friends: friends,
                                    user: result[0],
                                    customtheme: customtheme
                                })
                                
                            }
                        });

                    })


                });

            });

        });

    } else {
        return res.send(undefined);
    }
}