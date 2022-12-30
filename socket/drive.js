const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { random_str, validateEmail, validatePhone, getFilesizeInBytes, formatBytes } = require('../controllers/functions');
const cookie = require('cookie');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

const { getdecoded } = require('../controllers/getdecoded');


const { io } = require('../index');

io.on("connection", async (socket) => {

    const decoded = await getdecoded(cookie.parse(socket.handshake.headers.cookie).jwt);

    socket.on("getfileinfo", async (info) => {
        // get info du fichier si le fichier appartient bien au mec

        const decoded = await promisify(jwt.verify)(cookie.parse(socket.handshake.headers.cookie).jwt,
            process.env.JWT_SECRET
        );

        db.query('SELECT * FROM drive_files WHERE storage_name = ? AND owner = ?', [info.fileid, decoded.id], (error, result) => {
            if (error) {

            } else if (result.length != 0) {
                db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error1, result1) => {
                    if (error1) {
                        console.log(error1);
                    } else if (result1.length != 0) {
                        let a = '';
                        let b = '';

                        if (result1[0].name != null || result1[0].name != undefined) {
                            a = result1[0].name;
                        }
                        if (result1[0].surname != null || result1[0].surname != undefined) {
                            b = result1[0].surname;
                        }
                        socket.emit("recive_info", {
                            name: result[0].name,
                            public: result[0].public,
                            type: result[0].extension,
                            size: formatBytes(getFilesizeInBytes(path.join(`./resources/drive/`, `${result1[0].drive_path}`, `${info.fileid}`))),
                            location: "Mon drive",
                            owner: a + ' ' + b,
                            adddate: result[0].date
                        });
                    }
                });
            }
        });
    })
});