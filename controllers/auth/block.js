const mysql = require("mysql");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});

exports.block = async (req, res) => {

    // const req.decoded = await getdecoded(req.cookies.jwt);

    if (!req.args) return res.status(500).json({ error: 0 });
    if (!req.decoded || req.args.error) return res.status(401).json({ error: req.args.error });

    const { user_id } = req.body;

    if (req.decoded.id == 0) {
        res.json({ error: 1 })
    } else {
        if (user_id == undefined) {
            res.json({ error: 2 })
        } else {
            db.query('SELECT * FROM users_blockeds WHERE blocker = ? AND blocked = ?', [req.decoded.id, user_id], (error1, result1) => {
                if (result1.length == 0) {
                    db.query(`INSERT INTO users_blockeds (blocker, blocked) VALUES (${req.decoded.id}, ${user_id})`, [], (error2, results2) => {
                        res.json({ error: false, result: "blocked" });
                    })
                } else {
                    db.query(`DELETE FROM users_blockeds WHERE blocker = ? AND blocked = ?`, [req.decoded.id, user_id], (error2, results2) => {
                        res.json({ error: false, result: "unblocked" });
                    })
                }
            })
        }
    }
}
