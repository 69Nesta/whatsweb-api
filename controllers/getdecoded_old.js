const jwt = require('jsonwebtoken');
const { promisify } = require('util');
const mysql = require("mysql");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


exports.getdecoded = async (reqcookiesjwt) => {    
    return await getid(reqcookiesjwt)
}

function getid(reqcookiesjwt) {
    return new Promise(async (resolve, reject) => {
        let decoded;

        if (reqcookiesjwt) {
        
            try {
                decoded = await promisify(jwt.verify)(reqcookiesjwt,
                    process.env.JWT_SECRET
                );
                
                db.query('SELECT A.user_id, A.socketkey, A.expire FROM accounts A WHERE A.jwt_key = ?', [decoded.jwt_key], (error, result) => {
                    
                    if (result != undefined && result.length > 0) {
                        if(Date.now() - (result[0].expire * 1000) < 1000 * 60 * 60 * 24 * 90 ) {
                            response = { 
                                id: result[0].user_id,
                                socketkey: result[0].socketkey,
                                jwt_key: decoded.jwt_key
                            }

                            resolve(response)
                        } else {
                            resolve({ id: 0, socketkey: null })
                        }
                    } else {
                        resolve({ id: 0, socketkey: null })
                    }
                })
            } catch (error) {
                resolve({ id: 0, socketkey: null })
            }
        } else {
            resolve({ id: 0, socketkey: null })
        }
    })
}