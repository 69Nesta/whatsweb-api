const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone, getFilesizeInBytes, formatBytes } = require('../../controllers/functions');
const cookie = require('cookie');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { io } = require('../../index');

const { getdecoded } = require('../../controllers/getdecoded');


io.on("connection", async (socket) => {

    const decoded = await getdecoded(cookie.parse(socket.handshake.headers.cookie).jwt);

    socket.on("search_user", (info) => {
        // socket.to(msg.room).emit("usertyping", msg);

        function validateEmail(email) {
            const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            return re.test(String(email).toLowerCase());
        }

        if (validateEmail(info.email_user)) {
            io.to().emit("received_user", "Nouvel demande d'ami !");

            socket.emit("ifvalidateuser", "Utilisateur trouver !");
        } else {
            io.emit("ifvalidateuser", "Utilisateur introutavble !");
        }
    });
});