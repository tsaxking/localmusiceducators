const crypto = require('crypto');
const { accounts } = require('./databases');

const timeLast = 1000 * 60 * 60; // 1 hour

const cookieSettings = {
    maxAge: timeLast,
    httpOnly: true
}

function randomKey() {
    let key = crypto.randomBytes(36).toString('base64');
    setInterval(function() {
        roles.roleList.map(role => {
            role.key = crypto.randomBytes(36).toString('base64');
        });
    }, timeLast);
    return key;
}

let currentSessions = [];

const roles = {
    rolePaths: [
        { path: '/sign-in', roles: ['user'] },
        { path: '/sign-up', roles: ['user'] },
        { path: '/lesson-logs', roles: ['client', 'student'] },
        { path: '/transactions', roles: ['client', 'student'] },
        { path: '/my-account', roles: ['client'] },
        { path: '/create-account', roles: ['client'] },
        { path: '/admin', roles: ['admin'] },
        { path: '/clients', roles: ['admin'] },
        { path: '/client-profile', roles: ['admin'] },
        { path: '/admin-transactions', roles: ['admin'] }
    ],
    roleList: [{
            key: crypto.randomBytes(36).toString('base64'),
            title: 'user'
        },
        {
            key: crypto.randomBytes(36).toString('base64'),
            title: 'student'
        },
        {
            key: crypto.randomBytes(36).toString('base64'),
            title: 'client'
        },
        {
            key: crypto.randomBytes(36).toString('base64'),
            title: 'admin'
        }
    ],
    checkAuth: (req, res, titles) => {
        console.log('checking authentication');
        let allowed = true;
        try {
            let roleKeys = [];
            titles.map(title => {
                let { key } = roles.roleList.find(role => role.title == title);
                console.log('USER NEEDS: ' + title);
                roleKeys.push(key);
            })
            let { keys } = JSON.parse(parseCookies(req).keys);
            if (keys == undefined) return false;
            console.log(keys);
            keys.map(cookieKey => {
                let cookieRole = roles.roleList.find(role => role.key == cookieKey);
                try { console.log('USER HAS: ' + cookieRole.title); } catch (err) { console.log("USER HAS INVALID ROLE") }
            });
            roleKeys.map(roleKey => {
                if (keys.indexOf(roleKey) == -1) allowed = false;
            });
        } catch (err) {
            console.error(err);
            allowed = false;
        }
        return allowed;
    },
    authID: (req, id) => {
        const cookieId = roles.getID(req);
        return cookieId == id;
    },
    getID: (req) => {
        const { id } = parseCookies(req);
        console.log("ID: " + id);
        return id;
    },
    createRoles: (req, res, next) => {
        if (currentSessions.indexOf(req.sessionID) == -1) {
            var cookie = parseCookies(req);
            let keyObj;
            if (cookie.keys === undefined) {
                // res.clearCookie('keys');
                keyObj = {
                    keys: [
                        roles.roleList[0].key
                    ]
                }
                res.cookie('keys', JSON.stringify(keyObj), cookieSettings);
            } else {
                keyObj = JSON.parse(cookie.keys);
                let userRoles = [];
                for (var k in keyObj.keys) {
                    let keyRole = roles.roleList.find(keyRole => keyRole.key == keyObj.keys[k]);
                    if (!keyRole) {
                        // cookie key is invalid
                        keyObj.keys.splice(k, 1);
                        userRoles.push('user');
                    } else {
                        userRoles.push(keyRole.title);
                    }
                }
                if (keyObj.keys.length == 0) {
                    keyObj.keys = [roles.roleList[0].key];
                }
                // let userRoles = [];
                // req.userRoles = keyObj.keys.map(key => {
                //     let { title } = roles.roleList.find(role => role.key == key);
                //     userRoles.push(title);
                // });
                req.userRoles = userRoles;
                req.userKeys = keyObj.keys;
                // console.log("USER ROLES: " + req.userRoles);
                res.cookie('keys', JSON.stringify(keyObj), cookieSettings);
            }
            currentSessions.push(req.sessionID);
        }
        if (next) next();
        else return;
    },
    addKey: (req, res, title, keys) => {
        let giveRole = roles.roleList.find(role => role.title == title);
        let keyObj = {};

        if (keys == undefined) {
            let cookieKeys = parseCookies(req);
            keys = JSON.parse(cookieKeys.keys).keys;
            keys.map(cookieKey => {
                let role = roles.roleList.find(role => role.key = cookieKey);
            });
        }
        keys.push(giveRole.key);
        keyObj.keys = keys;
        res.cookie('keys', JSON.stringify(keyObj), cookieSettings);
    },
    resetKeys: (req, res) => {
        // res.cook('keys');
        res.cookie('keys', JSON.stringify({ keys: [roles.roleList[0].key] }));
    },
    removeKey: (req, res, title) => {
        let role = roles.roleList.find(role => role.title == title);
        let cookieKeys = parseCookies(req);
        let { keys } = JSON.parse(cookieKeys.keys);
        let index = keys.indexOf(role.key);
        keys.splice(index, 1);
        let keyObj = { keys: keys }
        res.cookie('keys', JSON.stringify(keyObj), cookieSettings);
        return keys;
    },
    getRoles(req) {
        let userRoles;
        let keys;
        if (req.userRoles != undefined) {
            userRoles = req.userRoles;
            keys = req.userKeys;
        } else {
            let cookieKeys = parseCookies(req);
            keys = JSON.parse(cookieKeys.keys).keys;
            console.log(roles.roleList);
            userRoles = keys.map(key => {
                console.log(key);
                let role = roles.roleList.find(role => role.key == key);
                // if (!role) return { keys: undefined, userRoles: ['user'] }
                return role.title;
            });
        }
        return { keys: keys, userRoles: userRoles }
    },
    getUsername(req) {
        try {
            let cookies = parseCookies(req);
            const { id } = cookies;
            if (!id) return undefined;
            accounts.all('SELECT * FROM users WHERE id = ?', [id], (err, rows) => {
                const account = rows[0];
                if (err) return undefined;
                return account.username;
            })
        } catch (err) {
            return undefined;
        }
    }
}

function parseCookies(req) {
    var list = {},
        rc = req.headers.cookie;
    rc = decodeURI(rc);
    rc = replaceAll(rc, '%3A', ':');
    rc = replaceAll(rc, '%2C', ',');
    rc = replaceAll(rc, '%2F', '/');
    rc = replaceAll(rc, '%2B', '+');
    rc && rc.split(';').forEach(function(cookie) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });
    console.log(list);
    return list;
}

function replaceAll(str, searchValue, value) {
    while (str.indexOf(searchValue) != -1) {
        str = str.replace(searchValue, value);
    }
    return str;
}

exports = module.exports = roles;