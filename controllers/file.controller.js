const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

async function getUserinfo(req) {
    const decoded = await promisify(jwt.verify)(req.cookies.jwt,
        process.env.JWT_SECRET
    );
    let drive_path = '';

    db.query('SELECT * FROM users WHERE id = ?', [decoded.id], async (error, results) => {
        if (error) { console.log(error); }
        if (results.length != 0 && results[0].drive == 1) {
            hasperm = true;
            if (results[0].drive_path == null) {
                drive_path = random_str(30);
                db.query("UPDATE users SET drive_path = ? WHERE id = ?", [drive_path, decoded.id], (error1, results1) => {
                    if (error1) { console.log(error1); }
                });
            } else {
                drive_path = results[0].drive_path;
            }
        }
    });
    setTimeout(() => {
        return [drive_path, decoded];
    }, 100);
}

const getListFiles = (req, res) => {
    setTimeout(() => {

        const directoryPath = __basedir + "/resources/drive/" + drive_path;

        fs.readdir(directoryPath, function (err, files) {
            if (err) {
                res.status(500).send({
                    message: "Unable to scan files!",
                });
            }

            let fileInfos = [];

            files.forEach((file) => {
                fileInfos.push({
                    name: file,
                    url: directoryPath + file,
                });
            });

            res.status(200).send(fileInfos);
        });
    }, 100);
};

const download = (req, res) => {
    const fileName = req.params.name;
    const directoryPath = __basedir + "/resources/static/assets/uploads/";

    res.download(directoryPath + fileName, fileName, (err) => {
        if (err) {
            res.status(500).send({
                message: "Could not download the file. " + err,
            });
        }
    });
};

module.exports = {
    upload,
    getListFiles,
    download,
};