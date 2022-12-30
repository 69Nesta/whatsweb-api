const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { sendmail, sendmailforgotpassword } = require('../auth/mail');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone } = require('../functions');
const { copyFile } = require("fs");

const { getdecoded } = require('../getdecoded');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { io } = require('../../index');


exports.getuser = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { user_id } = req.body;

    if (!user_id) {
        res.send("error1")
    } else {
        db.query('SELECT * FROM friends WHERE (sender = ? AND reciver = ?) OR (sender = ? AND reciver = ?)', [user_id, decoded.id, decoded.id, user_id], (error1, result1) => {
            db.query('SELECT * FROM users_blockeds WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)', [user_id, decoded.id, decoded.id, user_id], (errorb, resultb) => {
                db.query('SELECT id,name,surname,mail,phone,avatar,public_uuid,public_avatar,public_phone,public_status FROM users WHERE id = ?', [user_id], (error2, result2) => {
                    db.query('SELECT UNIX_TIMESTAMP(der_date) AS der_date,socketkey FROM accounts WHERE user_id = ?', [user_id], (error4, result4) => {
                        db.query('SELECT G.group_key FROM users_groups UG, groups G WHERE G.id = UG.group_id AND UG.user_id = ? AND G.isgroup = 0 INTERSECT SELECT G.group_key FROM users_groups UG, groups G WHERE G.id = UG.group_id AND UG.user_id = ? AND G.isgroup = 0', [user_id, decoded.id], (error3, result3) => {
                            if (result2[0] == undefined) {
                                // console.log(user_id)
                                return res.send("error2")
                            } else {

                                if(user_id == decoded.id) {

                                    userinfos = {
                                        isfriend: null,
                                        friendid: null,
                                        discuss: null,
                                        user: {
                                            id: result2[0].id,
                                            name: result2[0].name,
                                            surname: result2[0].surname,
                                            email: result2[0].mail,
                                            uuid: result2[0].public_uuid,
                                            phone: result2[0].phone,
                                            avatar: result2[0].avatar,
                                            status: null
                                        }
                                    }
                                    res.send(userinfos)

                                } else {
                                    if (resultb.length == 0) {
                                        let userinfos;

                                        let isfriend;
                                        let friendid;
                                        if (result1.length == 0) {
                                            isfriend = null;
                                            friendid = null;
                                        } else {
                                            isfriend = result1[0].accepted
                                            friendid = result1[0].id
                                        }
                                        let discuss = null;
                                        if (result3.length != 0) {
                                            discuss = result3[0].group_key
                                        }

                                        userinfos = {
                                            isfriend: isfriend,
                                            friendid: friendid,
                                            discuss: discuss,
                                            user: {
                                                id: result2[0].id,
                                                name: result2[0].name,
                                                surname: result2[0].surname,
                                                email: result2[0].mail,
                                                uuid: result2[0].public_uuid,
                                                phone: getphonenumber(result2[0], result1),
                                                avatar: getavatar(result2[0], result1),
                                                status: getstatus(result2[0], result1, result4)
                                            }
                                        }

                                        res.send(userinfos)

                                    } else {
                                        res.send("error-blocked")
                                    }
                                }
                            }
                        })
                    });
                })
            })
        })
    }
}

exports.loadgrouplight = async (req, res) => {
    const decoded = await getdecoded(req.cookies.jwt);

    const { group_id } = req.body;

    if (group_id == undefined || group_id == null) {
        res.send("error1")
    } else {
        db.query('SELECT id,group_name,lastmessagesee,key_image,lastmessagetext, UNIX_TIMESTAMP(group_date) AS group_date FROM groups WHERE group_key = ?', [group_id], (error1, result1) => {

            if (result1.length == 0) {
                res.send("error2")
            } else {
                db.query('SELECT id FROM users_groups WHERE group_id = ? AND user_id = ?', [result1[0].id, decoded.id], (error2, result2) => {
                    if (result2.length == 0) {
                        res.send("error3")
                    } else {
                        res.send({
                            group_name: result1[0].group_name,
                            lastmessagetext: result1[0].lastmessagetext,
                            lastmessagesee: result1[0].lastmessagesee,
                            key_image: result1[0].key_image,
                            group_date: result1[0].group_date
                        })
                    }
                })
            }
        })
    }
}

/*
$.ajax({
    type: "POST",
    url: "/auth/getuser",
    data: {
        user_id: 1
    },
    success: function (data) {
        
    }
})
*/

function getphonenumber(user, friend) {
    // user doit être égal à resultUser[0]
    // friends doit être égal à resultFriend (pas de [0])
    let phone;
    if (user.phone == null || user.phone == "") {
        phone = null;
    } else {
        if (user.public_phone == 1) {
            phone = user.phone;
        } else {
            if (friend.length == 0) {
                phone = null;
            } else {
                if (friend[0].accepted == 1) {
                    phone = user.phone;
                } else {
                    phone = null;
                }
            }
        }
    }
    return phone;
}

function getavatar(user, friend) {
    // user doit être égal à resultUser[0]
    // friends doit être égal à resultFriend (pas de [0])

    let avatar;
    if (user.public_avatar == 1) {
        avatar = user.avatar;
    } else {
        if (friend.length == 0) {
            avatar = "/img/default.svg";
        } else {
            if (friend[0].accepted == 1) {
                avatar = user.avatar;
            } else {
                avatar = "/img/default.svg";
            }
        }
    }
    return avatar;
}

function getstatus(user, friend, accounts) {
    // user doit être égal à resultUser[0]
    // friends doit être égal à resultFriend (pas de [0])
    let status;
    if (user.public_status == 0) {
        status = null;
    } else if (user.public_status == 2) {
        const lastdateonline = []
        accounts.forEach(element => {
            if (element.socketkey != null) {
                status = 1;
            } else {
                lastdateonline.push(element.der_date)
            }
        });
        if (status != 1) {
            lastdateonline.sort((a, b) => {
                return a - b;
            }).reverse()
            status = lastdateonline[0]
        }
    } else {
        if (friend.length == 0 && user.public_status == 1) {
            status = null;
        } else if (friend[0].accepted != 1 && user.public_status == 1) {
            status = null;
        } else {
            const lastdateonline = []
            accounts.forEach(element => {
                if (element.socketkey != null) {
                    status = 1;
                } else {
                    lastdateonline.push(element.der_date)
                }
            });
            if (status != 1) {
                lastdateonline.sort((a, b) => {
                    return a - b;
                }).reverse()
                status = lastdateonline[0]
            }
        }
    }
    return status;
}

