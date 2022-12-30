const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone, getFilesizeInBytes, formatBytes } = require('../../controllers/functions');
const cookie = require('cookie');
const Sequelize = require("sequelize");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { io } = require('../../index');

// On se connecte à la base
const sequelize = new Sequelize(process.env.DATABASE, process.env.DATABASE_USER, process.env.DATABASE_PASSWORD, {
    host: process.env.DATABASE_HOST,
    dialect: "mysql",
    logging: false
});

const { getdecoded } = require('../../controllers/getdecoded');


// // On charge le model chat
// const Chat = require("../../Models/Chat")(sequelize, Sequelize.DataTypes);

// // On effectue le chargement réel 
// Chat.sync();

io.on("connection", async (socket) => {

    const decoded = await getdecoded(cookie.parse(socket.handshake.headers.cookie).jwt);

    // On écoute les entrées dans les salles
    socket.on("enter_room", async (room) => {
        // On entre dans la salle demandée

        // console.log({id: decoded.id, room: room});
        socket.join(room);
        // console.log(socket.rooms);

        // On envoie tous les messages du salon
        // --------------------------------------------------------------------
        // Chat.findAll({
        //     attributes: ["id", "name", "message", "room", "createdAt"],
        //     where: {
        //         room: room
        //     }
        // }).then(list => {
        //     socket.emit("init_messages", { messages: JSON.stringify(list) });
        // });
        // --------------------------------------------------------------------


        // db.query('SELECT * FROM users WHERE id = ?', [decoded.id], async (error, results) => {
        // if(true == true) {
        db.query('SELECT * FROM chats WHERE room = ?', [room], async (error, results) => {
            socket.emit("init_messages", { messages: JSON.stringify(results) });
        });
        // }
        // });


    });

    // On écoute les sorties de salles
    socket.on("leave_room", (room) => {
        // On sors de la salle demandée
        socket.leave(room);
        // console.log(socket.rooms); 
    });
});