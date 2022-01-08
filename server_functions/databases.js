const locations = require("../locations");
const fs = require('fs');
const sqlLite3 = require('sqlite3').verbose();
// const axios = require('axios');
// const { open } = require('sqlite');
const crypto = require('crypto');

const { temp, stat, root } = locations;
/*
class Database {
    constructor(name, table, headers) {
        this.name = name;
        this.initDatabase();
    }

    initDatabase() {
        let path = `${root}/db/${this.name}.db`
        fs.writeFile(path, '', { flag: 'wx' }, function(err) {

        });
    }

    readDatabase() {
        this.data = new sqlLite3.Database(`db/${this.name}.db`, sqlLite3.OPEN_READWRITE, (err) => {
            if (err) // console.error(err.message);
        });
    }

    createTable(table, headers) {
        this[table].headersInsert = new Array(headers.length);
        for (x in this[table].headersInsert) {
            this[table].headersInsert[x] = '?'
        }
        headers = headers.toString();
        const sqlHeader = `CREATE TABLE IF NOT EXISTS ${table}(${headers})`;
        this.run(sqlHeader, (err) => {
            if (err) // console.error(err.message);
        });

    }

    async findRows(table, returnCols, testCol, value) {
        return await this.all(`SELECT ${returnCols.toString()} FROM ${table} WHERE ${testCol} = ?`, [value], async(err, rows) => {
            return rows;
        });
    }

    insertValues(table, values) {
        this.run(`INSERT INTO ${table} VALUES ${this[table].headersInsert}`, values);
    }
}
*/

let testNum = 0;
let Databases = {
    accounts: new sqlLite3.Database(`db/accounts.db`, sqlLite3.OPEN_READWRITE, (err) => {
        // console.log(1)
        if (err) {
            initFile('accounts', '', createAdmin);
        } else {
            testNum = 1;
        }
    }),
    ips: new sqlLite3.Database(`db/ips.db`, sqlLite3.OPEN_READWRITE, (err) => {
        if (err) initFile('tuning', '', createTuning);
    })
}


function initFile(dbName, data, callback) {
    fs.writeFile(`${root}/db/${dbName}.db`, data, { flag: 'wx' }, (err) => {
        Databases[dbName] = new sqlLite3.Database(`db/${dbName}.db`, sqlLite3.OPEN_READWRITE, (err) => {
            callback();
        });
    });
}

function createAdmin() {
    Databases.accounts.run("CREATE TABLE IF NOT EXISTS users(first_name,last_name,username,email,permissions,phone_number,password,id,info)", (err) => {
        const adminUsername = 'tsaxking';
        const adminPwd = 'Colorblin6dPresent/ationFluctuati*onInfrast%ructure';
        const adminSalt = crypto.randomBytes(36).toString('base64');
        Databases.accounts.all("SELECT username FROM users WHERE username = ?", [adminUsername], (err, rows) => {
            if (rows[0] == undefined) {
                crypto.pbkdf2(adminPwd, adminSalt, 2000000, 64, 'sha512', (err, derivedKey) => {
                    const adminPasswordJson = JSON.stringify({
                        password: derivedKey.toString('base64'),
                        salt: adminSalt,
                        iterations: 2000000
                    });
                    let adminInsert = [
                        "Taylor",
                        "King",
                        adminUsername,
                        "taylor.reese.king@gmail.com",
                        '{"roles":["admin"]}',
                        "(208) 392-8139",
                        adminPasswordJson,
                        crypto.randomBytes(36).toString('base64'),
                        JSON.stringify({ account_type: "admin" })
                    ]
                    Databases.accounts.all("INSERT INTO users VALUES (?,?,?,?,?,?,?,?,?)", adminInsert, (err) => {
                        Databases.accounts.close();
                        testNum = 1;
                    });
                });
            }
        });
    });
}

function createTuning() {
    Databases.tuning.all('CREATE TABLE IF NOT EXISTS notes(username,notes)', (err) => {});
}



exports = module.exports = {
    accounts: new sqlLite3.Database(`db/accounts.db`, sqlLite3.OPEN_READWRITE, (err) => {}),
    ips: new sqlLite3.Database(`db/ips.db`, sqlLite3.OPEN_READWRITE, (err) => {}),
    tuning: new sqlLite3.Database(`db/tuning.db`, sqlLite3.OPEN_READWRITE, (err) => {}),
    transactions: new sqlLite3.Database(`db/transactions.db`, sqlLite3.OPEN_READWRITE, (err) => {})
};