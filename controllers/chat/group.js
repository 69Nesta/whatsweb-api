const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone, removeDuplicates } = require('../functions');
const cookie = require('cookie');
const Cryptr = require('cryptr');

const { getdecoded } = require('../getdecoded');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { io } = require('../../index');

exports.group = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const { list_add, name, img } = req.body;

    if (list_add == undefined) {
        return res.send('error');
    } else if (list_add.length > 1 && (name == undefined || img == undefined)) {
        return res.send('error')
    } else if (list_add.length == 0) {
        return res.send('error')
    } else {
        let _list_add = removeDuplicates(list_add.split(','));

        db.query('SELECT * FROM friends WHERE sender = ? OR reciver = ?', [decoded.id, decoded.id], (error1, result1) => {

            error = false;
            if (result1.length == 0) {
                return res.send('error');
            } else {

                _list_add.forEach(element => {
                    if (!result1.filter(function (e) {
                        return e.sender == element;
                    }).length > 0 && !result1.filter(function (e) {
                        return e.reciver == element;
                    }).length > 0) {
                        return res.send('error2');
                    }
                });

                db.query('SELECT UGG.group_id,UGG.user_id,G.group_key,UGG.visible FROM users_groups UG, groups G, users_groups UGG WHERE UG.user_id = ? AND UGG.group_id = UG.group_id AND G.isgroup = 0 AND UG.group_id = G.id', [decoded.id], (error12, result12) => {
                    if (result12.filter(function (e) { return e.user_id == _list_add[0]; }).length > 0 && _list_add.length == 1 && result12.filter(function (e) { return e.user_id == decoded.id; })[0].visible == 1) {

                        return res.send("alreadyin-" + result12.filter(function (e) {
                            if (e.user_id == _list_add[0]) {
                                return e.group_key;
                            }
                        })[0].group_key);

                    } else if (result12.filter(function (e) { return e.user_id == _list_add[0]; }).length > 0 && _list_add.length == 1 && result12.filter(function (e) { return e.user_id == decoded.id; })[0].visible == 0) {

                        db.query('UPDATE users_groups SET visible = 1 WHERE user_id = ? AND group_id = ?', [decoded.id, result12.filter(function (e) { if (e.user_id == _list_add[0]) { return e.group_id; } })[0].group_id], (error13, result13) => { })

                        return res.send("retake-" + result12.filter(function (e) {
                            if (e.user_id == _list_add[0]) {
                                return e.group_key;
                            }
                        })[0].group_key);

                    } else {

                        let isgroup = 1;
                        let _name = name
                        let _img = img;

                        if (_list_add.length == 1) {
                            _name = null;
                            _img = null;
                            isgroup = 0;
                        }
                        db.query('SELECT group_key FROM groups', [], (error3, result3) => {

                            let group_key = random_str(20);

                            if (result3 != undefined) {
                                for (let i = 0; i < 1;) {
                                    if (result3.filter(function (e) {
                                        return e.group_key == group_key;
                                    }).length > 0) {
                                        group_key = random_str(20);
                                    } else {
                                        i = 1;
                                    }
                                }
                            }

                            db.query('SELECT name,surname,avatar FROM users WHERE id = ?', [decoded.id], async (errorname, resultname) => {
                                let message = resultname[0].name + " à créé le groupe"
                                if (_list_add.length == 1) {
                                    message = "Nouvelle discussion"
                                }

                                db.query('INSERT INTO groups SET ?', {
                                    isgroup: isgroup,
                                    group_name: _name,
                                    group_key: group_key,
                                    key_image: _img,
                                    lastmessagetext: message
                                }, (error2, results2) => {
                                    let encryptedstart = new Cryptr(group_key).encrypt('%start%')
                                    db.query('INSERT INTO messages SET ?', {
                                        group_id: results2.insertId,
                                        user_id: null,
                                        text: encryptedstart,
                                        message_key: random_str(25)

                                    }, (error7, results7) => {
                                        console.log(error7)
                                    });
                                    db.query('INSERT INTO users_groups SET ?', {
                                        group_id: results2.insertId,
                                        user_id: decoded.id,
                                        user_perm: 2
                                    }, (error4, results4) => { });
                                    _list_add.forEach(element => {
                                        db.query('INSERT INTO users_groups SET ?', {
                                            group_id: results2.insertId,
                                            user_id: element,
                                            user_perm: 0
                                        }, (error6, results6) => { });


                                        db.query('SELECT socketkey FROM accounts WHERE user_id = ?', [element], async (error5, results5) => {

                                            if (_list_add.length == 1) {
                                                _name = resultname[0].name + " " + resultname[0].surname;
                                                _img = resultname[0].avatar;
                                            }

                                            results5.forEach(element2 => {
                                                io.to(element2.socketkey).emit("group:invited", {
                                                    id: results2.insertId,
                                                    isgoup: isgroup,
                                                    name: _name,
                                                    group_key: group_key,
                                                    key_image: _img,
                                                    lastmessagetext: message
                                                });
                                            })

                                        });

                                    });
                                    try {
                                        return res.send('done-' + group_key);
                                    } catch (error) {
                                        console.log()
                                    }


                                });


                            });

                        });
                    }
                });
            }
        });
    }
}

exports.group_invit = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        list_add,
        group_key
    } = req.body

    if (list_add == undefined || group_key == undefined) {
        return res.send('error ')
    } else if (list_add.length == 0) {
        return res.send('error1')
    }

    let _list_add = removeDuplicates(list_add.split(','));

    db.query('SELECT * FROM friends WHERE sender = ? OR reciver = ?', [decoded.id, decoded.id], (error1, result1) => {

        error = false;
        if (result1.length == 0) {
            return res.send('error nofriend');
        }

        _list_add.forEach(element => {
            if (!result1.filter(function (e) {
                return e.sender == element;
            }).length > 0 && !result1.filter(function (e) {
                return e.reciver == element;
            }).length > 0) {
                return res.send('error1');
            }
        });
        db.query('SELECT UG.user_id,G.id,G.isgroup,G.group_name,G.key_image FROM users_groups UG, groups G WHERE G.group_key = ? AND UG.group_id = G.id', [group_key], (error4, result4) => {

            if (result4.length == 0) {
                return res.send('error2');
            }

            _list_add.forEach(element => {
                if (result4.filter(function (e) {
                    return e.user_id == element;
                }).length > 0) {
                    return res.send('error3');
                }
            });

            let isgroup = 1;

            if (!result4[0].isgroup) {
                return res.send('error5');
            }

            _list_add.forEach(element => {
                db.query('INSERT INTO users_groups SET ?', {
                    group_id: result4[0].id,
                    user_id: element,
                    user_perm: 0
                }, (error6, results6) => { });

                db.query('SELECT socketkey FROM accounts WHERE user_id = ?', [element], async (error5, results5) => {

                    results5.forEach(element2 => {
                        io.to(element2.socketkey).emit("group:invited", {
                            isgoup: isgroup,
                            name: result4[0].name,
                            group_key: group_key,
                            key_image: result4[0].key_image
                        });
                    })

                });

            });
            db.query('SELECT A.jwt_key,G.id,G.group_key,A.socketkey FROM users_groups UG, groups G, users U, accounts A WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                result5.forEach(element => {
                    if (element.jwt_key != decoded.jwt_key) {
                        io.to(element.socketkey).emit("group:update", {
                            id: element.id,
                            group_key: element.group_key,
                            date: new Date(),
                            status: "New update"
                        });
                    }
                });
            });
            return res.send('done');

        });

    });
}

exports.leave_group = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key
    } = req.body;

    if (group_key == undefined) {
        return res.send('error')
    } else if (group_key == "" || group_key == null) {
        return res.send('error')
    }

    db.query('SELECT * FROM groups G WHERE G.group_key = ?', [group_key], (error1, result1) => {
        if (result1.length == 0) {
            return res.send('error');
        }

        if (result1[0].isgroup == 0) {
            db.query('UPDATE users_groups SET visible = ? WHERE user_id = ? AND group_id = ?', [0, decoded.id, result1[0].id], (error2, result2) => {
                return res.send('removed-discuss-' + group_key);
            });
        } else {
            db.query('DELETE FROM users_groups WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {
                db.query('SELECT G.id,G.group_key,A.socketkey,A.jwt_key FROM users_groups UG, groups G, users U, accounts A WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                    result5.forEach(element => {
                        if (element.jwt_key != decoded.jwt_key) {
                            io.to(element.socketkey).emit("group:update", {
                                id: element.id,
                                group_key: element.group_key,
                                date: new Date(),
                                status: "New update"
                            });
                        }
                    });
                });
                return res.send('removed-group-' + group_key);
            });
        }
    });
}


exports.group_edit_picture = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key,
        group_image
    } = req.body;


    if (group_key == undefined || group_image == undefined) {
        return res.send('error')
    }

    db.query('SELECT id FROM groups G WHERE G.group_key = ?', [group_key], (error1, result1) => {
        if (result1.length == 0) {
            return res.send('error');
        }

        db.query('SELECT user_perm FROM users_groups WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {
            if (result2[0].user_perm == 1 || result2[0].user_perm == 2) {
                db.query('UPDATE groups SET key_image = ? WHERE id = ? AND group_key = ?', [group_image, result1[0].id, group_key], (error3, result3) => {

                    db.query('SELECT G.id,G.group_key,A.socketkey,A.jwt_key FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                        if (result5 != undefined) {
                            result5.forEach(element => {
                                if (element.jwt_key != decoded.jwt_key) {
                                    io.to(element.socketkey).emit("group:update", {
                                        id: element.id,
                                        group_key: element.group_key,
                                        date: new Date(),
                                        status: "New update"
                                    });
                                }
                            });
                        }
                    });

                    return res.send('done');

                });
            } else {
                return res.send("error3")
            }
        });
    });
}


exports.group_edit_name = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key,
        group_name
    } = req.body;

    if (group_key == undefined || group_name == undefined || group_name == null || group_name.replaceAll(" ", "") == "") {
        return res.send('error1')
    } else {

        db.query('SELECT id FROM groups G WHERE G.group_key = ?', [group_key], (error1, result1) => {
            if (result1.length == 0) {
                return res.send('error2');
            }

            db.query('SELECT user_perm FROM users_groups WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {
                if (result2[0].user_perm == 1 || result2[0].user_perm == 2) {
                    db.query('UPDATE groups SET group_name = ? WHERE id = ? AND group_key = ?', [group_name, result1[0].id, group_key], (error3, result3) => {

                        db.query('SELECT G.id,G.group_key,A.socketkey,A.jwt_key FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                            if (result5 != undefined) {
                                result5.forEach(element => {
                                    if (element.jwt_key != decoded.jwt_key) {
                                        io.to(element.socketkey).emit("group:update", {
                                            id: element.id,
                                            group_key: element.group_key,
                                            date: new Date(),
                                            status: "New update"
                                        });
                                    }
                                });
                            }
                        });


                        return res.send('done');

                    });
                } else {
                    return res.send("error3")
                }
            });
        });
    }
}


exports.group_edit_notifs = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key,
        state
    } = req.body;

    if (group_key == undefined || state == undefined) {
        return res.send('error1')
    } else {
        db.query('SELECT id FROM groups G WHERE G.group_key = ?', [group_key], (error1, result1) => {
            if (result1.length == 0) {
                return res.send('error2');
            }

            if (state == "true") {
                db.query('UPDATE users_groups SET notifications = 1 WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {
                    return res.send("done")
                });
            } else {
                db.query('UPDATE users_groups SET notifications = 0 WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {
                    return res.send("done")
                });
            }
        });
    }
}


exports.friend_not_in_group = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key
    } = req.body;

    if (group_key == undefined) {
        return res.send('error1')
    } else {
        db.query('SELECT user_perm FROM users_groups UG, groups G WHERE UG.user_id = ? AND UG.group_id = G.id AND G.group_key = ?', [decoded.id, group_key], (error2, result2) => {
            if (result2.length == 0) {
                return res.send("error2")
            } else {

                if (result2[0].user_perm == 1 || result2[0].user_perm == 2) {

                    db.query('SELECT F.sender AS userid FROM friends F WHERE F.reciver = ? EXCEPT SELECT UG.user_id FROM users_groups UG, groups G WHERE UG.group_id = G.id AND G.group_key = ? UNION SELECT F.reciver AS userid FROM friends F WHERE F.sender = ? EXCEPT SELECT UG.user_id FROM users_groups UG, groups G WHERE UG.group_id = G.id AND G.group_key = ?', [decoded.id, group_key, decoded.id, group_key], (error1, result1) => {
                        let userslist = [];
                        let nluser = result1.length;

                        result1.forEach(element => {
                            db.query('SELECT name, surname, mail, avatar FROM users WHERE id = ?', [element.userid], (error3, result3) => {
                                userslist.push({
                                    id: element.userid,
                                    name: result3[0].name,
                                    surname: result3[0].surname,
                                    mail: result3[0].mail,
                                    avatar: result3[0].avatar,
                                })
                                nluser = nluser - 1;

                                if (nluser == 0) {
                                    return res.send(userslist)
                                }
                            })
                        })

                    })
                } else {
                    return res.send("error3")
                }
            }
        })
    }
}


exports.group_set_owner = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key,
        user_id
    } = req.body;

    if (group_key == undefined || user_id == undefined) {
        return res.send('error1')
    } else {
        db.query('SELECT id FROM groups G WHERE G.group_key = ?', [group_key], (error1, result1) => {
            if (result1.length == 0) {
                return res.send('error2');
            }

            db.query('SELECT user_perm FROM users_groups WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {

                if (result2[0].user_perm == 2) {

                    db.query('UPDATE users_groups SET user_perm = ( CASE WHEN `user_id` = ? THEN 1 WHEN `user_id` = ? THEN 2 ELSE user_perm END ) WHERE (user_id = ? OR user_id = ?) AND group_id = ?', [decoded.id, user_id, decoded.id, user_id, result1[0].id], (error3, result3) => {

                        db.query('SELECT G.id,G.group_key,A.socketkey,A.jwt_key FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                            if (result5 != undefined) {
                                result5.forEach(element => {
                                    if (element.jwt_key != decoded.jwt_key) {
                                        io.to(element.socketkey).emit("group:update", {
                                            id: element.id,
                                            group_key: element.group_key,
                                            date: new Date(),
                                            status: "New update"
                                        });
                                    }
                                });
                            }
                        });

                        return res.send('done');

                    });
                } else {
                    return res.send("error3")
                }
            });
        });
    }

}


exports.group_set_mod = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key,
        user_id
    } = req.body;

    if (group_key == undefined || user_id == undefined) {
        return res.send('error1')
    } else {
        db.query('SELECT id FROM groups G WHERE G.group_key = ?', [group_key], (error1, result1) => {
            if (result1.length == 0) {
                return res.send('error2');
            }

            db.query('SELECT user_perm FROM users_groups WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {

                if (result2[0].user_perm == 2) {

                    db.query('UPDATE users_groups SET user_perm = 1 WHERE user_id = ? AND group_id = ?', [user_id, result1[0].id], (error3, result3) => {

                        db.query('SELECT G.id,G.group_key,A.socketkey,A.jwt_key FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                            if (result5 != undefined) {
                                result5.forEach(element => {
                                    if (element.jwt_key != decoded.jwt_key) {
                                        io.to(element.socketkey).emit("group:update", {
                                            id: element.id,
                                            group_key: element.group_key,
                                            date: new Date(),
                                            status: "New update"
                                        });
                                    }
                                });
                            }
                        });

                        return res.send('done');

                    });
                } else {
                    return res.send("error3")
                }
            });
        });
    }


}


exports.group_set_member = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key,
        user_id
    } = req.body;

    if (group_key == undefined || user_id == undefined) {
        return res.send('error1')
    }

    db.query('SELECT id FROM groups G WHERE G.group_key = ?', [group_key], (error1, result1) => {
        if (result1.length == 0) {
            return res.send('error2');
        } else {
            db.query('SELECT user_perm FROM users_groups WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {

                if (result2[0].user_perm == 2) {

                    db.query('UPDATE users_groups SET user_perm = 0 WHERE user_id = ? AND group_id = ?', [user_id, result1[0].id], (error3, result3) => {

                        db.query('SELECT G.id,G.group_key,A.socketkey,A.jwt_key FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                            if (result5 != undefined) {
                                result5.forEach(element => {
                                    if (element.jwt_key != decoded.jwt_key) {
                                        io.to(element.socketkey).emit("group:update", {
                                            id: element.id,
                                            group_key: element.group_key,
                                            date: new Date(),
                                            status: "New update"
                                        });
                                    }
                                });
                            }
                        });

                        return res.send('done');

                    });
                } else {
                    return res.send("error3")
                }
            });
        }
    });
}


exports.group_expulse = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const {
        group_key,
        user_id
    } = req.body;

    if (group_key == undefined || user_id == undefined) {
        return res.send('error1')
    } else {

        db.query('SELECT id FROM groups G WHERE G.group_key = ?', [group_key], (error1, result1) => {
            if (result1.length == 0) {
                return res.send('error2');
            } else {
                db.query('SELECT user_perm FROM users_groups WHERE user_id = ? AND group_id = ?', [decoded.id, result1[0].id], (error2, result2) => {

                    if (result2[0].user_perm == 2) {

                        db.query('DELETE FROM users_groups WHERE user_id = ? AND group_id = ?', [user_id, result1[0].id], (error3, result3) => {

                            db.query('SELECT socketkey FROM accounts WHERE user_id = ? AND socketkey IS NOT NULL', [user_id], (error5, result5) => {
                                result5.forEach(element => {
                                    io.to(element.socketkey).emit("group:remove", {
                                        group_key: group_key
                                    });
                                })
                            });

                            db.query('SELECT G.id,G.group_key,A.socketkey,A.jwt_key FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                                if (result5 != undefined) {
                                    result5.forEach(element => {
                                        if (element.socketkey != null && element.user_id != decoded.id) {
                                            io.to(element.socketkey).emit("group:update", {
                                                id: element.id,
                                                group_key: element.group_key,
                                                date: new Date(),
                                                status: "New update"
                                            });
                                        }
                                    });
                                }
                            });

                            return res.send('done');

                        });
                    } else if (result2[0].user_perm == 1) {
                        db.query('SELECT user_perm FROM users_groups WHERE user_id = ? AND group_id = ?', [user_id, result1[0].id], (error3, result3) => {
                            if (result3[0].user_perm == 0) {

                                db.query('DELETE FROM users_groups WHERE user_id = ? AND group_id = ?', [user_id, result1[0].id], (error4, result4) => {

                                    db.query('SELECT socketkey FROM accounts WHERE user_id = ? AND socketkey IS NOT NULL', [user_id], (error5, result5) => {
                                        result5.forEach(element => {
                                            io.to(element.socketkey).emit("group:remove", {
                                                group_key: group_key
                                            });
                                        })
                                    });

                                    db.query('SELECT G.id,G.group_key,A.socketkey,A.jwt_key FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id AND U.id = A.user_id AND A.socketkey IS NOT NULL', [group_key], (error5, result5) => {
                                        result5.forEach(element => {
                                            if (element.socketkey != null && element.user_id != decoded.id) {
                                                io.to(element.socketkey).emit("group:update", {
                                                    id: element.id,
                                                    group_key: element.group_key,
                                                    date: new Date(),
                                                    status: "New update"
                                                });
                                            }
                                        });
                                    });

                                    return res.send('done');

                                });
                            } else {
                                return res.send("error4")
                            }
                        })
                    } else {
                        return res.send("error3")
                    }
                });
            }
        });
    }
}



exports.testdb = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const { group_key } = req.body;

    // db.query('SELECT * FROM users_groups UG, groups G WHERE G.group_key = ? AND UG.group_id = G.id', [group_key], (error1, result1) => {
    //     console.log(result1);
    // });

    //LIMIT 10,20

    // db.query('SELECT * FROM users_groups LIMIT 8', [], (error1, result1) => {
    //     console.log(result1, error1);
    // });



    // db.query('SELECT UGG.* FROM users_groups UG, groups G, users_groups UGG WHERE UG.user_id = ? AND UGG.group_id = UG.group_id AND G.isgroup = 0 AND UG.group_id = G.id', [2], (error12, result12) => {

    //     console.log(result12);

    //     console.log(result12.filter(function (e) { return e.user_id == 1; }).length > 0)

    // });


    // db.query('SELECT UG.user_id, UG.user_perm, G.*, U.name, U.avatar, U.socketkey FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error1, result1) => {
    //     console.log(result1);
    // });


    // AND U.id = (F.sender OR F.reciver) <> ?
    // db.query('SELECT F.* FROM friends F WHERE (F.sender = ? OR F.reciver = ?)', [decoded.id, decoded.id, decoded.id], (error1, result1) => {
    //     console.log(result1);
    // });

    // good get all groups
    // db.query('SELECT G.* FROM users_groups UG, groups G WHERE UG.user_id = ? AND G.id = UG.group_id ORDER BY G.lastmessagedate DESC', [decoded.id], (error1, result1) => {
    //     console.log(result1);
    // });

    return res.send('')

}