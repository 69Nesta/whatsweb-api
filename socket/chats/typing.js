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

const { getdecoded } = require('../../controllers/getdecoded');


const { io } = require('../../index');

io.on("connection", async (socket) => {

    const decoded = await getdecoded(cookie.parse(socket.handshake.headers.cookie).jwt);

    // On écoute les messages "typing"
    socket.on("typing", msg => {
        socket.to(msg.room).emit("usertyping", msg);
    });
});