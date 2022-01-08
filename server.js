const express = require('express');
const locations = require('./locations');
const fs = require('fs');
const HTMLConstructor = require('./server_functions/html_constructor');
const init = require('./server_functions/init');
const { teachers } = require('./server_functions/databases');

const { temp, stat, root } = locations;

const blankHTML = fs.readFileSync(`${temp}/blank.html`).toString();
const indexHTML = fs.readFileSync(`${temp}/index.html`).toString();

const app = express();

const routes = [
    '/home',
    '/instructors',
    '/database',
    '/find-my-instructor',
    '/'
]

app.use('/*', init);

app.get('/database', (req, res) => {
    let html = fs.readFileSync(`${temp}/database.html`);
    teachers.all('SELECT * FROM teachers', (err, rows) => {
        let teachRepeat = [];
        for (x in rows) {
            let account = rows[x];
            teachRepeat.push([
                ['name', account.name],
                ['rates', account.rates],
                ['education', account.education],
                ['instrument', account.instrument]
            ]);
        }
        let constructorOptions;
        let constructor;
        if (req.headers.index_loaded == 'true') {
            constructorOptions = {
                replaceArray: [
                    ['subpage', html]
                ],
                repeatObj: {
                    teachRepeat: teachRepeat
                },
                sendToClient: true
            }
            constructor = new HTMLConstructor(req, res, blankHTML, constructorOptions);
        } else {
            constructorOptions = {
                replaceArray: [
                    ['_subpage_', html]
                ],
                repeatOb: {
                    teachRepeat: teachRepeat
                },
                sendToClient: true
            }
            constructor = new HTMLConstructor(req, res, indexHTML, constructorOptions);
        }
        constructor.render();
    });
});

app.get('/*', (req, res, next) => {
    let { url } = req;
    if (url == '/') url = '/home';

    let head = fs.readFileSync(`${temp}/head.html`).toString();
    let page = fs.readFileSync(`${temp}/404.html`).toString();
    if (routes.indexOf(req.url) != -1) page = fs.readFileSync(temp + url).toString();
    if (req.headers.index_loaded != "true") {
        let html = fs.readFileSync(`${temp}/index.html`).toString();
        let head = fs.readFileSync(`${temp}/head.html`).toString();
        let page = fs.readFileSync(`${temp}/404.html`).toString();
        if (routes.indexOf(req.url) != -1) page = fs.readFileSync(temp + url).toString();
        const username = roles.getUsername(req);
        const constructorOptions = {
            sendToClient: true,
            ifConditions: [{
                token: 'account_dropdown',
                valueIfTrue: `<h4 class="center account-dropdown_text">${username}</h4><h5 class="account-dropdown_text"><a href="/account/my-account/${username}" class="link account-dropdown_text">My Account</a><p/><h5><a href="/sign-out" class="link account-dropdown_text">Sign Out</a></h5>`,
                condition: roles.checkAuth(req, res, ['client']),
                elseCondition: roles.checkAuth(req, res, ['admin']),
                elseTrue: `<h4 class="center account-dropdown_text">${username}</h4><h5 class="account-dropdown_text"><a href="/admin/home" class="link account-dropdown_text">To Admin</a></h5><h5 class="account-dropdown_text"><a href="/sign-out" data-link="nav" class="link account-dropdown_text">Sign Out</a></h5>`,
                elseFalse: `<h5 class="account-dropdown_text"><a href="/account/sign-in" data-link="nav" class="link account-dropdown_text">Sign In</a></h5><h5 class="account-dropdown_text"><a href="/account/sign-up" data-link="nav" class="link account-dropdown_text">Sign Up</a></h5>`
            }],
            replaceArray: [
                ['_subpage_', page],
                ['_head_', head]
            ]
        }
        let constructor = new HTMLConstructor(req, res, html, constructorOptions);
        constructor.render();
    } else {
        next();
    }
});

app.listen(process.env.PORT || 3000, () => console.log("Server is running..."));