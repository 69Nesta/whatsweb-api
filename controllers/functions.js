const mysql = require("mysql");

const db = mysql.createConnection({
    host: process.env.DATABASE_HOST,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASSWORD,
    database: process.env.DATABASE
});


exports.random_str = (length) => {
    var result = '';
    var characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}
  
exports.validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
}
  
exports.validatePhone = (phone) => {
    const re = /^((?:\+|00)[17](?: |\-)?|(?:\+|00)[1-9]\d{0,2}(?: |\-)?|(?:\+|00)1\-\d{3}(?: |\-)?)?(0\d|\([0-9]{3}\)|[1-9]{0,3})(?:((?: |\-)[0-9]{2}){4}|((?:[0-9]{2}){4})|((?: |\-)[0-9]{3}(?: |\-)[0-9]{4})|([0-9]{7}))$/;
    return re.test(String(phone).replace(' ', '').replace('-', ''));
}


exports.getFilesizeInBytes = (filename) => {
    const stats = fs.statSync(filename);
    const fileSizeInBytes = stats.size;
    return fileSizeInBytes;
}
exports.formatBytes = (bytes, decimals = 2) => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

exports.removeDuplicates = (inputArr) => {
    var found = {};
    var out = inputArr.filter(function (element) {
        return found.hasOwnProperty(element) ? false : (found[element] = true);
    });
    return out;
}


exports.getphonenumber = (user, friend) => {
    // user doit être égal à resultUser[0]
    // friends doit être égal à resultFriend (pas de [0])
    let phone;
    if(user.phone == null || user.phone == "") {
        phone == null;
    } else {
        if(user.public_phone == 1) {
            phone = user.phone;
        } else {
            if(friend.length == 0) {
                phone == null;
            } else {
                if(friend[0].accepted == 1) {
                    phone = user.phone;
                } else {
                    phone = null;
                }
            }
        }
    }
    return phone;
}

exports.getavatar = (user, friend) => {
    // user doit être égal à resultUser[0]
    // friends doit être égal à resultFriend (pas de [0])
    let avatar;
    if(user.public_avatar == 1) {
        avatar = user.avatar;
    } else {
        if(friend.length == 0) {
            avatar == "/img/default.svg";
        } else {
            if(friend[0].accepted == 1) {
                avatar = user.avatar;
            } else {
                avatar = "/img/default.svg";
            }
        }
    }
    return avatar;
}

exports.getstatus = (user, friend) => {
    // user doit être égal à resultUser[0]
    // friends doit être égal à resultFriend (pas de [0])
    return new Promise(async (resolve, reject) => {

        db.query('SELECT socketkey FROM accounts WHERE user_id = ?', [user.id], (error, result) => {



            let status;
            if(user.public_status == 0) {
                status = null;
            } else if(user.public_status == 2) {
                const lastdateonline = []
                result.forEach(element => {
                    if (element.socketkey != null) {
                        status = 1;
                    } else {
                        lastdateonline.push(element.der_date)
                    }
                });
                if (status != 1) {
                    lastdateonline.sort((a, b) => {
                        return a - b;
                    }).reverse()
                    status = lastdateonline[0]
                }
            } else {
                if(friend.length == 0 && user.public_status == 1) {
                    status = null;
                } else if(friend[0].accepted != 1 && user.public_status == 1) {
                    status = null;
                } else {
                    const lastdateonline = []
                    result.forEach(element => {
                        if (element.socketkey != null) {
                            status = 1;
                        } else {
                            lastdateonline.push(element.der_date)
                        }
                    });
                    if (status != 1) {
                        lastdateonline.sort((a, b) => {
                            return a - b;
                        }).reverse()
                        status = lastdateonline[0]
                    }
                }
            }
            resolve(status);

        });
    })  
}

exports.isblocked = async (you, guy) => {    
    // you = decoded.id
    // guy = l'id de la personne qui vous aurai bloqué 

    return new Promise((resolve,reject)=>{

        db.query('SELECT * FROM users_blockeds WHERE (blocker = ? AND blocked = ?) OR (blocker = ? AND blocked = ?)', [you, guy, guy, you], (errorb, resultb) => {
            if(resultb.length == 0) {
                resolve(0);
            } else {
                resolve(1);
            }
        })

    })

}