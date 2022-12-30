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


/*

je t'envoie 
id + priority (0 a 4)
tu modifie la prio de l'id dans la database si j'ai la pe remove

new : { group_key, title, description, istitle, parent_id, priority_level }
edit : { group_key, id, title, description }

*/

exports.gettodo = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);
    const { group_key } = req.body;

    if (group_key) {
        db.query('SELECT G.id AS group_id, U.id, U.name, U.surname, U.avatar, U.public_uuid, UG.todo_perm FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
            if (result4 == undefined || !result4.length > 0) {
                return res.send('error');
            }

            if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
                return res.send('error');
            } else {
                db.query('SELECT * FROM todolist WHERE group_id = ?', [result4[0].group_id], (e, r) => {
                    if (e) {
                        return res.send('error');
                    } else {

                        const final_json_return = []
                        const users_group = [];

                        r.forEach(element => {
                            if (element.istitle == 1) {
                                const cache_childrens = []
                                r.filter(element1 => element1.parent_id == element.id && element1.istitle == 0).forEach(element1 => {
                                    cache_childrens.push({
                                        id: element1.id,
                                        title: element1.title,
                                        description: element1.description,
                                        priority: element1.priority_level,
                                        checked: element1.checked,
                                        date: element1.date,
                                        parentid: element1.parent_id
                                    })
                                })
                                final_json_return.push({
                                    id: element.id,
                                    title: element.title,
                                    description: element.description,
                                    priority: element.priority_level,
                                    childrens: cache_childrens,
                                    date: element.date
                                });
                            }
                        });

                        // id, name, surname, avatar, users_groups.todo_perm

                        result4.filter(function (e) { return e.id != decoded.id; }).forEach(element => {
                            users_group.push({ id: element.id, name: element.name, surname: element.surname, avatar: element.avatar, public_uuid: element.public_uuid, todo_perm: element.todo_perm })
                        });

                        return res.send({ todo: final_json_return, perm: result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm, users_group: users_group });
                    }
                })
            }


        });


    } else {
        res.send('error')
    }


}
/*
( istitle == 0 && parent_id != null ) || ( istitle == 1 && parent_id == null )

func add, remove, edit, set : [ checked, priority ]

*/

exports.add = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);
    const { group_key, title, description, istitle, parent_id, priority_level } = req.body;

    if ((title || parent_id || priority_level).replaceAll(' ', '') == "") {
        return res.send('error')
    } else {
        db.query('SELECT G.id AS group_id, U.id, UG.todo_perm FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
            if (result4 == undefined || !result4.length > 0) {
                return res.send('error1');
            }

            if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
                return res.send('error2');
            } else if (istitle == 0 && parent_id != null && priority_level != null && Number.isInteger(Number.parseInt(priority_level)) && title.length <= 200 && result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm == 1) {
                db.query('INSERT INTO todolist SET ?', { user_id: decoded.id, group_id: result4[0].group_id, istitle: 0, parent_id: parent_id, title: title, description: description, priority_level: Number.parseInt(priority_level) }, (error, results) => {
                    if (error) {
                        return res.send('error3')
                    } else {
                        res.send('done-' + results.insertId)

                        db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                            results4.forEach(element => {
                                if (element.socketkey) {
                                    io.to(element.socketkey).emit("todolist:new", {
                                        group_key: group_key,
                                        id: results.insertId,
                                        isparent: 0,
                                        title: title,
                                        description: description,
                                        priority: priority_level,
                                        parent_id: parent_id,
                                        date: Date.now()
                                    });
                                }
                            })
                        });
                        return;
                    }
                });

            } else if (istitle == 1 && parent_id == null && priority_level != null && Number.isInteger(Number.parseInt(priority_level)) && title.length <= 200 && result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm == 1) {
                db.query('INSERT INTO todolist SET ?', { user_id: decoded.id, group_id: result4[0].group_id, istitle: 1, title: title, description: description, priority_level: Number.parseInt(priority_level) }, (error, results) => {
                    if (error) {
                        return res.send('error4')
                    } else {
                        res.send('done-' + results.insertId)

                        db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                            results4.forEach(element => {
                                if (element.socketkey) {
                                    io.to(element.socketkey).emit("todolist:new", {
                                        group_key: group_key,
                                        id: results.insertId,
                                        isparent: 1,
                                        title: title,
                                        description: description,
                                        priority: priority_level,
                                        date: Date.now()
                                    });
                                }
                            })
                        });
                        return;
                    }

                });

            } else {
                return res.send('error')
            }
        });
    }
}

exports.remove = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);
    const { group_key, id } = req.body;

    db.query('SELECT G.id AS group_id, U.id, UG.tofo_perm FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
        if (result4 == undefined || !result4.length > 0) {
            return res.send('error');
        }

        if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
            return res.send('error');
        } else if (result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm == 1 && id != null && Number.isInteger(Number.parseInt(id))) {
            db.query('DELETE FROM todolist WHERE id = ? AND group_id = ?', [id, result4[0].group_id], (error2, result2) => {
                if (error2) {
                    return res.send('error')
                } else {
                    res.send('done');

                    db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                        results4.forEach(element => {
                            if (element.socketkey) {
                                io.to(element.socketkey).emit("todolist:removed", {
                                    group_key: group_key,
                                    id: id,
                                    author: decoded.id,
                                    date: Date.now()
                                });
                            }
                        })
                    });
                    return;
                }
            })
        } else {
            return res.send('error')
        }
    });

}

exports.edit = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);
    const { group_key, id, title, description } = req.body;

    db.query('SELECT G.id AS group_id, U.id, UG.todo_perm FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
        if (result4 == undefined || !result4.length > 0) {
            return res.send('error');
        }

        db.query('SELECT partent_id FROM todolist WEHRE id = ? AND group_id = ?', [id, result4[0].group_id], (error_parent_id, result_parent_id) => {
            if (error_parent_id) {
                return res.send('error')
            }
            
            let is_parent = result_parent_id[0].parent_id ? 1 : 0



            if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
                return res.send('error');
            } else if (result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm) {
                if ((title || description).replaceAll(' ', '') != "" && title && description && title.length < 200) {
                    db.query('UPDATE todolist SET title = ? AND description = ? AND date = ? WHERE id = ? AND group_id = ?', [title, description, Date.now(), id, result4[0].group_id], (error2, result2) => {
                        if (error2) {
                            return res.send('error')
                        } else {
                            res.send('done');

                            db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                                results4.forEach(element => {
                                    if (element.socketkey) {
                                        io.to(element.socketkey).emit("todolist:edited", {
                                            group_key: group_key,
                                            id: id,
                                            title: title,
                                            description: description,
                                            author: decoded.id,
                                            is_parent: is_parent,
                                            date: Date.now()
                                        });
                                    }
                                })
                            });
                            return;
                        }
                    });
                } else if (title.replaceAll(' ', '') != "" && title && title.length < 200) {
                    db.query('UPDATE todolist SET title = ? AND date = ? WHERE id = ? AND group_id = ?', [title, Date.now(), id, result4[0].group_id], (error2, result2) => {
                        if (error2) {
                            return res.send('error')
                        } else {
                            res.send('done');

                            db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                                results4.forEach(element => {
                                    if (element.socketkey) {
                                        io.to(element.socketkey).emit("todolist:edited", {
                                            group_key: group_key,
                                            id: id,
                                            title: title,
                                            author: decoded.id,
                                            is_parent: is_parent,
                                            date: Date.now()
                                        });
                                    }
                                })
                            });
                            return;
                        }
                    });
                } else if (description.replaceAll(' ', '') != "" && description && !title) {
                    db.query('UPDATE todolist SET description = ? AND date = ? WHERE id = ? AND group_id = ?', [description, Date.now(), id, result4[0].group_id], (error2, result2) => {
                        if (error2) {
                            return res.send('error')
                        } else {
                            res.send('done');

                            db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                                results4.forEach(element => {
                                    if (element.socketkey) {
                                        io.to(element.socketkey).emit("todolist:edited", {
                                            group_key: group_key,
                                            id: id,
                                            description: description,
                                            author: decoded.id,
                                            is_parent: is_parent,
                                            date: Date.now()
                                        });
                                    }
                                })
                            });
                            return;
                        }
                    });
                } else {
                    return res.send('error');
                }
            } else {
                return res.send('error')
            }
        });
    });
}

exports.set_checked = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);
    const { group_key, id, parent_id, checked } = req.body;

    db.query('SELECT G.id AS group_id, U.id, UG.todo_perm FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
        if (result4 == undefined || !result4.length > 0) {
            return res.send('erro0r');
        }

        if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
            return res.send('error1');
        } else if (result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm == 1 && (Number.parseInt(checked) == 0 || Number.parseInt(checked) == 1)) {
            db.query('UPDATE todolist SET checked = ? WHERE id = ? AND group_id = ?', [Number.parseInt(checked), id, result4[0].group_id], (error2, result2) => {
                if (error2) {
                    return res.send('error2')
                } else {
                    res.send('done');

                    db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                        results4.forEach(element => {
                            if (element.socketkey) {
                                io.to(element.socketkey).emit("todolist:checked_edited", {
                                    group_key: group_key,
                                    id: id,
                                    isparent: 0,
                                    parent_id: parent_id,
                                    checked: Number.parseInt(checked),
                                    author: decoded.id,
                                    date: Date.now()
                                });
                            }
                        })
                    });
                    return;
                }
            });
        } else {
            console.log(result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm == 1, Number.parseInt(checked) == 0, Number.parseInt(checked) == 1)
            return res.send('error')
        }
    });
}

exports.set_priority = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);
    const { group_key, id, priority } = req.body;

    db.query('SELECT G.id AS group_id, U.id, UG.todo_perm FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
        if (result4 == undefined || !result4.length > 0) {
            return res.send('error');

        }

        if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
            return res.send('error');
        } else if (result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm == 1 && Number.parseInt(priority) < 5) {
            db.query('UPDATE todolist SET priority_level = ? WHERE id = ? AND group_id = ?', [Number.parseInt(priority), id, result4[0].group_id], (error2, result2) => {
                if (error2) {
                    return res.send('error')
                } else {
                    res.send('done')

                    db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                        results4.forEach(element => {
                            if (element.socketkey) {
                                io.to(element.socketkey).emit("todolist:priority_edited", {
                                    group_key: group_key,
                                    id: id,
                                    priority: Number.parseInt(priority),
                                    author: decoded.id,
                                    date: Date.now()
                                });
                            }
                        })
                    });
                    // return;
                }
            });
        } else {
            console.log(result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm == 1, Number.parseInt(priority) < 5)
            return res.send('error')
        }
    });
}

exports.set_checked_all = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);
    const { group_key, id, checked } = req.body;

    db.query('SELECT G.id AS group_id, U.id, UG.todo_perm FROM users_groups UG, groups G, users U WHERE G.group_key = ? AND UG.group_id = G.id AND U.id = UG.user_id', [group_key], (error4, result4) => {
        if (result4 == undefined || !result4.length > 0) {
            return res.send('error');
        }

        if (!result4.filter(function (e) { return e.id == decoded.id; }).length > 0) {
            return res.send('error');
        } else if (result4.filter(function (e) { return e.id == decoded.id; })[0].todo_perm == 1 && Number.isInteger(Number.parseInt(checked)) && (Number.parseInt(checked) == 0 || Number.parseInt(checked) == 1)) {
            db.query('UPDATE todolist SET checked = ? WHERE parent_id = ? AND group_id = ?', [Number.parseInt(checked), id, result4[0].group_id], (error2, result2) => {
                if (error2) {
                    return res.send('error')
                } else {
                    res.send('done');

                    db.query('SELECT DISTINCT A.socketkey, A.user_id FROM users_groups UG, groups G, accounts A WHERE UG.group_id = G.id AND A.user_id = UG.user_id AND G.id = ?', [result4[0].group_id], async (error4, results4) => {
                        results4.forEach(element => {
                            if (element.socketkey) {
                                io.to(element.socketkey).emit("todolist:checked_edited", {
                                    group_key: group_key,
                                    id: id,
                                    isparent: 1,
                                    checked: Number.parseInt(checked),
                                    author: decoded.id,
                                    date: Date.now()
                                });
                            }
                        })
                    });
                    return;
                }
            });
        } else {
            return res.send('error')
        }
    });
}