const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const mysql = require("mysql");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    res_userinfo: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


exports.getdecoded = async (reqcookiesjwt) => {
    return new Promise(async (resolve, reject) => {
        if (!reqcookiesjwt)
            resolve({ id: 0, socketkey: null });

        const decoded = await promisify(jwt.verify)(reqcookiesjwt,
            process.env.JWT_SECRET
        );

        db.query('SELECT A.user_id AS id, A.socketkey, A.expire, U.* FROM accounts A, users U WHERE A.jwt_key = ? AND U.id = A.user_id', [decoded.jwt_key], (err_account, res_userinfo) => {
            if (Date.now() - (res_userinfo.expire * 1000) < 1000 * 60 * 60 * 24 * 90) {
                resolve({
                    ...res_userinfo,
                    jwt_key: decoded.jwt_key
                });
            } else {
                resolve({ id: 0, socketkey: null });
            }
        });
    })
}