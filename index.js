const express = require("express");
const path = require('path');
const dotenv = require('dotenv');
const multer = require('multer');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const fs = require('fs');
const compression = require('compression')
const useragent = require('express-useragent');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { Color } = require('color-in-terminal');
const cors = require("cors");
const mysql = require("mysql");
const webpush = require("web-push");

const app = express();
app.use(compression());
app.use(useragent.express());

dotenv.config({ path: './.env' });

// On créé le serveur http
const http = require("http").createServer(app);

const io = require("socket.io")(http);

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE,
    charset: 'utf8mb4_unicode_ci'
});

app.use(
    cors({
        origin: "*",//"http://localhost:3001",
                // Get    Add     Suppr     Update     
        methods: ["GET", "POST", "DELETE", "PATCH"],
        credentials: true,
    })
);

(() => {
    try {
        console.log(`\n${Color.FgWhite}Connection to the database...${Color.Reset}`)

        db.connect((error) => {
            if (error) {
                console.log(error)
            } else {
                console.log(`${Color.FgWhite}Connection successful !${Color.Reset}\n`)
            }
        })

        webpush.setVapidDetails(
            "mailto:support@whatsweb.fr",
            process.env.PUBLICKEY,
            process.env.PRIVATEKEY
        );
        exports.io = io;
        
        db.query('UPDATE accounts SET socketkey = ?', [null], (error, result) => { if (error) { console.log(error); } });

        const publicDirectory = path.join(__dirname, './public');
        app.use(express.static(publicDirectory));

        // Parse URL-encoded bodies (as sent by HTML forms)
        app.use(express.urlencoded({ extended: false }));
        // Parse JSON bodies (as sent by API clients)
        app.use(express.json());
        app.use(cookieParser());
        app.set('view engine', 'hbs');


        //Define Routes
        // app.use('/', require('./routes/pages')); // <- Pages
        app.use('/auth', require('./routes/auth')); // <- Accounts
        // app.use('/post', require('./routes/post')); // <- Post
        // app.use('/tag', require('./routes/tag')); // <- Tag
        // app.use('/author', require('./routes/author')); // <- Tag
        // app.use('/attachments', require('./routes/attachments')); // <- Uplaod wallpaper
        // app.use('/avatars', require('./routes/avatars')); // <- Uplaod Avatar
        // app.use('/like', require('./routes/like')); // <- Like
        
        // app.use(() => (err, req, res, next) => {
        //     if (err instanceof multer.MulterError) {
        //         res.status(418).send(err.code);
                
        //     }
        // });

        app.use(function (req, res, next) {
            res.status(404);

            res.format({
                html: function () {
                    res.render('404', { url: req.url });
                },
                json: function () {
                    res.json({ error: 'Not found', code: 404 });
                },
                default: function () {
                    res.type('txt').send('Not found');
                }
            })
        });

        // On va demander au serveur http de se lancer
        const PORT = 3000
        http.listen(PORT, () => {
            console.log(Color.FgCyan + " *  " + Color.Reset + Color.FgGreen + Color.Underscore + "http://localhost:" + PORT + Color.Reset);
        });
    } catch (e) {
        console.error(e)
    }
})();