const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
const { brotliDecompress } = require("zlib");
const { getdecoded } = require('./getdecoded');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

function sleep(ms) {
    return new Promise(
        resolve => setTimeout(resolve, ms)
    );
}

exports.isLoggedInDrive = async (req, res, next) => {
    // console.log(req.cookies);
    if (req.cookies.jwt) {
        try {
            //1) verify the token
            const decoded = await getdecoded(req.cookies.jwt);

            //console.log(decoded);

            //2) Check if the user still exists
            db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
                // console.log(result);

                if (!result) {
                    return next();
                }
                // let ip = req.socket.remoteAddress.split('::ffff:')[1];
                // if (ip == undefined) { ip = 'introuvable'; }

                // db.query('UPDATE users SET der_connexion_ip = ?, der_connexion_date = ? WHERE id = ?', [ip, new Date(), decoded.id], (error5, result5) => { });


                req.user = result[0];

                if (req.params.folder != undefined || req.params.folder != null) {
                    if (req.params.folder == 'trash') {
                        db.query('SELECT * FROM drive_folders WHERE owner = ? AND deleted = ? ORDER BY name ASC', [decoded.id, 1], (error1, result1) => {
                            if (error1) { console.log(error1); }

                            req.user.folderslist = result1;
                        });
                        db.query('SELECT * FROM drive_files WHERE owner = ? AND deleted = ? ORDER BY name ASC', [decoded.id, 1], (error1, result1) => {
                            if (error1) { console.log(error1); }

                            req.user.fileslist = result1;
                        });
                    } else if (req.params.folder == 'favoris') {
                        db.query('SELECT * FROM drive_files WHERE owner = ? AND important = ? AND deleted = ? ORDER BY name ASC', [decoded.id, 1, 0], (error1, result1) => {
                            if (error1) { console.log(error1); }

                            req.user.fileslist = result1;
                        });
                    } else if (req.params.folder == 'recent') {
                        db.query('SELECT * FROM drive_files WHERE owner = ? AND deleted = ? ORDER BY date DESC', [decoded.id, 0], (error1, result1) => {
                            if (error1) { console.log(error1); }

                            req.user.fileslist = result1;
                        });
                    } else {
                        db.query('SELECT * FROM drive_folders WHERE folder = ?', [req.params.folder], (error2, result2) => {
                            if (error2) { console.log(error2); }

                            if (result2.length == 0 || (result2[0].owner != decoded.id && result2[0].public == 0)) {
                                req.user.erroronloadfolder = true;
                            } else if (result2[0].owner != decoded.id && result2[0].public == 1) {
                                db.query('SELECT * FROM drive_folders WHERE owner = ? AND parent = ? AND deleted = ? ORDER BY name ASC', [result2[0].owner, req.params.folder, 0], (error1, result1) => {
                                    if (error1) { console.log(error1); }

                                    req.user.folderslist = result1;
                                });

                                db.query('SELECT * FROM drive_files WHERE owner = ? AND parent_folder = ? AND deleted = ? ORDER BY name ASC', [result2[0].owner, req.params.folder, 0], (error1, result1) => {
                                    if (error1) { console.log(error1); }

                                    req.user.fileslist = result1;
                                });

                                db.query('SELECT parent FROM drive_folders WHERE owner = ? AND folder = ? AND deleted = ? ORDER BY name ASC', [result2[0].owner, req.params.folder, 0], (error1, result1) => {
                                    if (error1) { console.error(error1); }

                                    req.user.parent = result1[0].parent;
                                    req.user.parentt = true;

                                    db.query('SELECT * FROM drive_folders WHERE owner = ? AND folder = ? AND deleted = ? ORDER BY name ASC', [result2[0].owner, result1[0].parent, 0], (error2, result2) => {
                                        if (error2) { console.log(error2); }

                                        req.user.parentinfo = result2[0];
                                    });
                                });
                            } else {
                                db.query('SELECT * FROM drive_folders WHERE owner = ? AND parent = ? AND deleted = ? ORDER BY name ASC', [decoded.id, req.params.folder, 0], (error1, result1) => {
                                    if (error1) { console.log(error1); }

                                    req.user.folderslist = result1;
                                });

                                db.query('SELECT * FROM drive_files WHERE owner = ? AND parent_folder = ? AND deleted = ? ORDER BY name ASC', [decoded.id, req.params.folder, 0], (error1, result1) => {
                                    if (error1) { console.log(error1); }

                                    req.user.fileslist = result1;
                                });

                                db.query('SELECT * FROM drive_folders WHERE owner = ? AND folder = ? AND deleted = ? ORDER BY name ASC', [decoded.id, req.params.folder, 0], async (error1, result1) => {
                                    if (error1) { console.error(error1); }

                                    req.user.parent = req.params.folder;
                                    req.user.parentt = true;

                                    const arbo = [];

                                    let old_folder = req.params.folder;

                                    let arbo_level = result1[0].arbo_level;

                                    if (arbo_level >= 3) {
                                        arbo_level = 3;
                                    }

                                    if (result1[0].arbo_level == 0) {
                                        db.query('SELECT * FROM drive_folders WHERE owner = ? AND folder = ? ORDER BY name ASC', [decoded.id, old_folder], (error3, result3) => {
                                            if (error3) { console.error(error3); }

                                            let arbo_info = { folder: result3[0].folder, name: result3[0].name };

                                            arbo.push(arbo_info);
                                        });
                                    } else {
                                        for (let i = 0; i <= arbo_level; i++) {

                                            db.query('SELECT * FROM drive_folders WHERE owner = ? AND folder = ? ORDER BY name ASC', [decoded.id, old_folder], (error3, result3) => {
                                                if (error3) { console.error(error3); }

                                                old_folder = result3[0].parent;

                                                let arbo_info = { folder: result3[0].folder, name: result3[0].name };

                                                arbo.push(arbo_info);
                                            });
                                            await sleep(2);

                                        }
                                    }

                                    if (result1[0].arbo_level >= 4) {
                                        let arbo_info2 = { folder: "", name: "..." };

                                        arbo.push(arbo_info2);
                                    }

                                    req.user.arbo = arbo.reverse();

                                    //  > <a href="/drive/">Dossier 1</a>
                                });
                            }
                        });
                    }
                } else {
                    db.query('SELECT * FROM drive_folders WHERE owner = ? AND parent IS NULL AND deleted = 0 ORDER BY name ASC', [decoded.id], (error1, result1) => {
                        if (error1) { console.log(error1); }

                        req.user.folderslist = result1;
                    });

                    db.query('SELECT * FROM drive_files WHERE owner = ? AND parent_folder IS NULL AND deleted = 0 ORDER BY name ASC', [decoded.id], (error1, result1) => {
                        if (error1) { console.log(error1); }

                        req.user.fileslist = result1;
                    });

                    req.user.parent = "null";
                    req.user.parentt = false;
                }

                setTimeout(() => {
                    return next();
                }, 100);

            });
        } catch (error) {
            console.log(error);
            return next();
        }
    } else {
        next();
    }
}
