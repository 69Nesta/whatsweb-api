const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone, removeDuplicates } = require('../functions');
const cookie = require('cookie');

const { getdecoded } = require('../getdecoded');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { io } = require('../../index');

exports.discussion = async (req, res) => {

    const decoded = await getdecoded(req.cookies.jwt);

    const { id } = req.body;

    db.query('SELECT socketkey FROM users WHERE id = ', [id], (error1, result1) => {

        if (result1.length == 0) {
            return res.send('error');
        }


        db.query('SELECT group_key FROM groups', [], (error3, result3) => {

            let group_key = random_str(20);

            if (result3 != undefined) {
                for (let i = 0; i < 1;) {
                    if (result3.filter(function (e) { return e.group_key == group_key; }).length > 0) {
                        group_key = random_str(20);
                    } else { i = 1; }
                }
            }


            db.query('INSERT INTO groups SET ?', { isgroup: 0, group_key: group_key }, (error2, results2) => {

                db.query('INSERT INTO users_groups SET ?', { group_key: group_key, user_id: decoded.id, user_perm: 2 }, (error4, results4) => { });
                db.query('INSERT INTO users_groups SET ?', { group_key: group_key, user_id: id, user_perm: 0 }, (error6, results6) => { });


                if (results5.length > 0 && results5[0].socketkey != null) {
                    io.to(results5[0].socketkey).emit("group:invited", {
                        id: results2.insertId,
                        isgoup: 0,
                        group_key: group_key,
                    });
                }
                
                return res.send({ id: results2.insertId, group_key: group_key });
            });

        });

    });
}