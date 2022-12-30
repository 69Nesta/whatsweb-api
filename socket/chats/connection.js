const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const {
    promisify
} = require('util');
const {
    random_str,
    validateEmail,
    validatePhone,
    getFilesizeInBytes,
    formatBytes
} = require('../../controllers/functions');
const cookie = require('cookie');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const {
    io
} = require('../../index');

const { getdecoded } = require('../../controllers/getdecoded');


io.on("connection", async (socket) => {

    let decoded = await getdecoded(cookie.parse(socket.handshake.headers.cookie).jwt);


    if (decoded.id != 0) {

        console.log({
            id: socket.id,
            cookie: decoded.id,
            status: "online"
        });

        db.query('UPDATE accounts SET socketkey = ? WHERE user_id = ? AND jwt_key = ?', [socket.id, decoded.id, decoded.jwt_key], (error, result) => {
            // console.log(error, decoded.id);
            // sendsocketforupdate(decoded.id, decoded.jwt_key)
            decoded.socketkey = socket.id
        });

        // refrsh lui meme si deco 

        socket.on("disconnect", () => {
            console.log({
                id: socket.id,
                cookie: decoded.id,
                status: "offline"
            });
            db.query('UPDATE accounts SET socketkey = null, der_date = ? WHERE user_id = ? AND jwt_key = ?', [new Date(), decoded.id, decoded.jwt_key], (error, result) => { });
            decoded.socketkey = null
            setTimeout(() => {
                db.query('SELECT public_status FROM users U WHERE id = ?', [decoded.id], (error, result) => {
                    if (decoded.socketkey == null && result[0].public_status != 0) {
                        sendsocketforupdate(decoded.id, decoded.jwt_key)
                    }
                });
            }, 1000);

        });
    }

});



function sendsocketforupdate(user_id, jwt_key) {
    
    //db.query('SELECT DISTINCT U.socketkey FROM users_groups UG, groups G, users U WHERE G.group_key IN (SELECT G.group_key FROM users_groups UG, groups G WHERE UG.user_id = ? AND G.id = UG.group_id AND G.isgroup = 0) AND UG.group_id = G.id AND U.id = UG.user_id AND U.socketkey IS NOT NULL AND U.id != ?', [user_id, user_id, jwt_key], async (error2, results2) => {
    db.query('SELECT DISTINCT A.socketkey FROM users_groups UG, groups G, users U, accounts A WHERE G.group_key IN (SELECT G.group_key FROM users_groups UG, groups G WHERE UG.user_id = ? AND G.id = UG.group_id AND G.isgroup = 0) AND UG.group_id = G.id AND U.id = UG.user_id AND A.socketkey IS NOT NULL AND A.jwt_key != ? AND A.user_id = U.id', [user_id, jwt_key], async (error2, results2) => {
        results2.forEach(element => {
            io.to(element.socketkey).emit("friends:update", {
                id: user_id
            });
        })

    });
}