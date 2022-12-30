const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');

const { getdecoded } = require('../getdecoded');


const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.deconnection = async (req, res) => {
    if (req.cookies.jwt) {
        try {
            const decoded = await getdecoded(req.cookies.jwt);

            if (decoded.id == 0) {
                res.cookie('jwt', 'logout', {
                    expires: new Date(Date.now() + 2 * 1000),
                    httpOnly: true
                });
                return res.status(404);
            }

            const { id } = req.params;

            db.query('DELETE FROM accounts WHERE user_id = ? AND id = ?', [decoded.id, id], (e, r) => {
                if (e) {
                    return res.status(404);
                } else {
                    return res.json({ error: false })
                }
            })

        } catch (error) {
            return res.status(404);
        }
    } else {
        return res.json({ error: 2 })
    }
}