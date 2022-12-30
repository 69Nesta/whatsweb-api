const mysql = require("mysql");
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { promisify } = require('util');
var nodemailer = require('nodemailer');

const db = mysql.createConnection({
  host: process.env.DATABASE_HOST,
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE
});


exports.updateuser = async (req, res) => {
  //console.log(req.body);

  const decoded = await promisify(jwt.verify)(req.cookies.jwt,
    process.env.JWT_SECRET
  );

  const { id, active, name } = req.body;

  if ( id !== undefined ) {

    if ( name == "validMail" ) {
      db.query("UPDATE users SET confirmedEmail = ? WHERE id = ?", [true_false(active), id], (error1, results1) => {
        if(error1) {
          console.log(error1);
        }
      });
    } else if ( name == "validDiscord" ) {
      db.query("UPDATE users SET confirmedDiscord = ? WHERE id = ?", [true_false(active), id], (error1, results1) => {
        if(error1) {
          console.log(error1);
        }
      });
    } else if ( name == "closed" ) {
      db.query("UPDATE users SET closed = ? WHERE id = ?", [true_false(active), id], (error1, results1) => {
        if(error1) {
          console.log(error1);
        }
      });
    } else if ( name == "drive" ) {
      db.query("UPDATE users SET drive = ? WHERE id = ?", [true_false(active), id], (error1, results1) => {
        if(error1) {
          console.log(error1);
        }
      });
    }
  }
  setTimeout(() => {
    return res.redirect('/users');
  }, 100);
}

function true_false(value) {
  if (value == 'true') {
    return 1;
  } else {
    return 0;
  }
}

exports.isLoggedInAdminEdit = async (req, res, next) => {
  // console.log(req.cookies);
  if( req.cookies.jwt) {
    try {
      //1) verify the token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //console.log(decoded);

      //2) Check if the user still exists
      db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
        // console.log(result);

        if(!result) {
          return next();
        }


        req.user = result[0];


        db.query('SELECT * FROM users', (error1, result1) => {
          req.user.allusers = result1;
          // info.set('nbnormal', result1.length);
        });

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

exports.isLoggedInAdminViewUser = async (req, res, next) => {
  // console.log(req.cookies);
  if( req.cookies.jwt) {
    try {
      //1) verify the token
      const decoded = await promisify(jwt.verify)(req.cookies.jwt,
        process.env.JWT_SECRET
      );

      //console.log(decoded);

      //2) Check if the user still exists
      db.query('SELECT * FROM users WHERE id = ?', [decoded.id], (error, result) => {
        // console.log(result);

        if(!result) {
          return next();
        }

        req.user = result[0];

        db.query('SELECT * FROM users WHERE id = ?', [req.query.id], (error1, result1) => {
          if(!result1) {
            return next();
          }
          req.user.user = result1[0];
        });

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
