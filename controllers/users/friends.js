const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone } = require('../functions');
const cookie = require('cookie');

const { getdecoded } = require('../getdecoded');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { io } = require('../../index');

exports.searchfriend = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const { email } = req.body;

    db.query('SELECT id,mail,avatar,name,surname FROM users WHERE mail = ?', [email], (error, result) => {

        if (error) {
            console.log(error);
            return res.send('notfound');
        }

        if (result.length == 0) {
            return res.send('notfound');
        } else if (result[0].id == decoded.id) {
            return res.send('notfound');
        } else {
            if (result[0].id == decoded.id) {

                return res.send('notfound');
            } else {
                return res.send(result[0]);
            }
        }
    });

}


exports.friends = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const { email } = req.body;

    if (!email) {
        res.status(404).send('error')
    }

    db.query('SELECT id,avatar,name,surname,mail,public_uuid FROM users WHERE mail = ?', [email], (error, result) => {

        if (error) {
            console.log(error);
            return res.status(404).render('404');
        }

        if (result.length == 0) {
            return res.send('cantfinduser');
        } else if (result[0].id == decoded.id) {
            return res.send('cantfinduser');
        } else {
            db.query('SELECT socketkey FROM accounts WHERE user_id = ?', [result[0].id], (errorsk, resultsk) => {

                db.query('SELECT * FROM users_blockeds WHERE (blocker = ? AND blocked = ?) OR (blocked = ? AND blocker = ?)', [result[0].id, decoded.id, decoded.id, result[0].id], (error1, result1) => {
                    if (error1) {
                        console.log(error1);
                    }

                    if (result1.length != 0) {
                        return res.send('cantfinduser');
                    } else {

                        db.query('SELECT * FROM friends WHERE (sender = ? AND reciver = ?) OR (sender = ? AND reciver = ?)', [result[0].id, decoded.id, decoded.id, result[0].id], (error2, result2) => {
                            if (error2) {
                                console.log(error2);
                            }
                            if (result2.length == 0) {
                                db.query('INSERT INTO friends SET ?', { sender: decoded.id, reciver: result[0].id }, (error1, results1) => {
                                    if (error1) {
    
                                        console.log(error1);
                                    } else {
                                        if (resultsk.length != 0) {
                                            db.query('SELECT avatar,name,surname,mail,public_uuid FROM users WHERE id = ?', [decoded.id], (error3, result3) => {
                                                resultsk.forEach(element => {
                                                    io.to(element.socketkey).emit("friends:new_request", {
                                                        id: decoded.id,
                                                        avatar: result3[0].avatar,
                                                        name: result3[0].name,
                                                        surname: result3[0].surname,
                                                        mail: result3[0].mail,
                                                        public_uuid: result3[0].public_uuid,
                                                        friends_id: results1.insertId
                                                    });
                                                })
                                            });
                                        }
                                        return res.send('done');
                                    }
                                });
                            } else if (result2[0].sender == result[0].id && result2[0].accepted == 0) {
                                db.query('UPDATE friends SET accepted = ?, date_accepted = ? WHERE id = ?', [1, new Date(), result2[0].id], (error1, result1) => {
                                    db.query('SELECT id,avatar,name,surname,mail,public_uuid,socketkey FROM users WHERE id = ?', [decoded.id], (error3, result3) => {
                                        if (resultsk.length != 0) {
                                            
                                            resultsk.forEach(element => {
                                                io.to(element.socketkey).emit("friends:accepted_request", {
                                                    id: result3[0].id,
                                                    avatar: result3[0].avatar,
                                                    name: result3[0].name,
                                                    surname: result3[0].surname,
                                                    mail: result3[0].mail,
                                                    public_uuid: result3[0].public_uuid,
                                                    friends_id: result2[0].id
                                                });
                                            })
                                        }
                                        if (resultsk.length != 0) {
    
                                            resultsk.forEach(element => {
                                                io.to(element.socketkey).emit("friends:accepted_request", {
                                                    id: result[0].id,
                                                    avatar: result[0].avatar,
                                                    name: result[0].name,
                                                    surname: result[0].surname,
                                                    mail: result[0].mail,
                                                    public_uuid: result[0].public_uuid,
                                                    friends_id: result2[0].id
                                                });
                                            })
    
                                        }
    
                                        return res.send('done');
                                    });
                                });
                            } else {
                                return res.send('alreadyadded');
                            }
    
                        });

                    }
                });
            })
        }
    });


}


exports.replyfriend = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const { id, status } = req.params;

    db.query('SELECT * FROM friends WHERE (sender = ? OR reciver = ?) AND id = ?', [decoded.id, decoded.id, id], (error2, result2) => {
        if (error2) {
            console.log(error2);
        }
        if (result2.length == 0) {

            return res.send('error');

        } else {

            if (status == 0) {
                db.query('DELETE FROM friends WHERE id = ?', [id], (error, result) => {

                    let id_remove

                    if (result2[0].reciver != decoded.id) {

                        id_remove = result2[0].reciver;

                    } else {
                        id_remove = result2[0].sender;
                    }

                    db.query('SELECT socketkey FROM accounts WHERE user_id = ?', [id_remove], (error1, result1) => {
                        if (result1.length != 0 && result2[0].accepted != 0) {

                            result1.forEach(element => {

                                io.to(element.socketkey).emit("friends:remove", {
                                    friends_id: id
                                });

                            })
    
                        }
                        return res.send('done');
                    });
                });

                // envoyer a moi le suppr
            } else if (status == 1) {
                db.query('UPDATE friends SET accepted = ?, date_accepted = ? WHERE id = ?', [status, new Date(), id], (error, result) => {

                    db.query('SELECT id,avatar,name,surname,mail,public_uuid FROM users WHERE id = ?', [result2[0].reciver], (error1, result1) => {
                        db.query('SELECT id,avatar,name,surname,mail,public_uuid FROM users WHERE id = ?', [result2[0].sender], (error3, result3) => {
                            
                            db.query('SELECT socketkey FROM accounts WHERE user_id = ?', [result2[0].reciver], (errorsk, resultsk) => {
                                if (resultsk.length != 0) {
        
                                    resultsk.forEach(element => {
        
                                        io.to(element.socketkey).emit("friends:accepted_request", {
                                            id: result3[0].id,
                                            avatar: result3[0].avatar,
                                            name: result3[0].name,
                                            surname: result3[0].surname,
                                            mail: result3[0].mail,
                                            public_uuid: result3[0].public_uuid,
                                            friends_id: id
                                        });
        
                                        io.to(element.socketkey).emit("friends:update", {
                                            id: result3[0].id
                                        });

                                    })
            
                                }
                            });

                            db.query('SELECT socketkey FROM accounts WHERE user_id = ?', [result2[0].sender], (errorsk, resultsk) => {
                                if (resultsk.length != 0) {
        
                                    resultsk.forEach(element => {
        
                                        io.to(element.socketkey).emit("friends:accepted_request", {
                                            id: result1[0].id,
                                            avatar: result1[0].avatar,
                                            name: result1[0].name,
                                            surname: result1[0].surname,
                                            mail: result1[0].mail,
                                            public_uuid: result1[0].public_uuid,
                                            friends_id: id
                                        });
        
                                        io.to(element.socketkey).emit("friends:update", {
                                            id: result1[0].id
                                        });

                                    })
            
                                }
                            });
    
                        });
                    });
                    
                    
                    return res.send('accepted');
                });
                // envoyer au 2 les ammis (accepted_request);
            } else if (status == 2) {
                db.query('UPDATE friends SET accepted = ?, date_accepted = ? WHERE id = ?', [status, new Date(), id], (error, result) => {
                    return res.send('blocked');
                });
            } else {
                return res.send('error');
            }

        }
    });

}

exports.getguybyfriendid = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const { id } = req.body;

    db.query('SELECT * FROM friends WHERE (sender = ? OR reciver = ?) AND id = ?', [decoded.id, decoded.id, id], (error2, result2) => {
        if (error2) {
            console.log(error2);
        }
        if (result2.length == 0) {
            return res.send('error');
        } else {
            let id_friend;

            if (result2[0].reciver != decoded.id) {

                id_friend = result2[0].reciver;

            } else {
                id_friend = result2[0].sender;
            }

            res.send({id: id_friend});

        }
    });
}