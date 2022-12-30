const mysql = require("mysql");
const { getdecoded } = require('./getdecoded');

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.isLoggedIn = async (req, res, next) => {
    if (req.cookies.jwt) {
        try {
            //1) verify the token
            const decoded = await getdecoded(req.cookies.jwt);

            if (decoded.id == 0) {
                res.cookie('jwt', 'logout', {
                    expires: new Date(Date.now() + 2 * 1000),
                    httpOnly: false
                });
                req.args = {
                    error: 0
                }
                return next();
            }

            if (!decoded) {
                return next();
            }
            if (decoded.mail_confirmed == false) {
                req.args = {
                    error: true,
                    reason: 'MailNotConfirmed'
                }
                return next();
            } if (decoded.closed == true) {
                req.args = {
                    error: true,
                    reason: 'AccountClosed'
                }
                return next();
            } else {
                req.decoded = decoded
                req.args = {
                    error: false
                }
                return next();
            }
        } catch (error) {
            req.args = {
                error: true,
                reason: 'error'
            }
            return next();
        }
    } else {
        req.args = { error: 1 }
        return next();
    }
}