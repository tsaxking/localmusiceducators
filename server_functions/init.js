const { Router } = require('express');
const locations = require('../locations');
const fs = require('fs');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const requestIp = require('request-ip');
const { ips } = require('./server_functions/databases');

const { root, temp, stat } = locations;


const router = Router();


router.use('/*', (req, res, next) => {
    let ip = requestIp.getClientIp(req);
    ips.all('SELECT * FROM ips WHERE ip = ?', [ip], (err, rows) => {
        if (rows[0] == undefined) {
            next();
        } else {
            console.log('BLOCKED CLIENT: ' + ip);
            res.status(403).json({ status: "blocked", msg: "403 (FORBIDDEN): You have sent too many requests to the server, your IP address has been blocked" });
        };
    });
});


router.use(cookieParser());


function displayRequest(req, res, next) {
    console.log(`${req.method} - ${req.url}`);
    next();
}

let ipAddresses = {}

function serverTimeout(req, res, next) {
    let ip = requestIp.getClientIp(req);
    if (ipAddresses[ip] == undefined) ipAddresses[ip] = 0;
    setInterval(function() {
        // Every 60 seconds, reset the count
        ipAddresses[ip] = 0;
    }, 60000);
    next();
}

router.use(serverTimeout);

router.use('/*', (req, res, next) => {
    let ip = requestIp.getClientIp(req);
    ipAddresses[ip]++;
    // console.log(ipAddresses);
    if (ipAddresses[ip] > 1000) {
        ips.run('INSERT INTO ips VALUES (?)', [ip]);
    }
    next();
})

router.use(session({
    secret: 'cookie_secret',
    resave: true,
    saveUninitialized: true
}))

router.use(displayRequest);
router.use(roles.createRoles);
router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());


// Protection
router.use(helmet());

function initializeServerConnection(req, res, next) {
    if (!req.headers.index_loaded) {
        res.set("Content-Security-Policy", "frame-src https://*.google.com https://anchor.fm https://youtube.com https://www.youtube.com https://giphy.com https://www.gstatic.com 'self';script-src 'self' https://*.google.com https://www.gstatic.com/ https://*.anchor.fm https://*.paypal.com https://s.ytimg.com https://youtube.com sdk.librato.com http://*.googleapis.com http://cdnjs.cloudflare.com;child-src https://youtube.com;");
    }
    next();
}

router.use(initializeServerConnection);

app.get("/*", (req, res, next) => {
    let signInOrUp = (req.url == '/account/sign-in' || req.url == '/account/sign-up' || req.url == '/account/signed-out'),
        accountReq = req.url.split("/").indexOf('account') != -1,
        adminReq = req.url.split('/').indexOf('admin') != -1
    if (!signInOrUp && (accountReq || adminReq)) {
        next();
    } else {
        next();
    }
});

router.use("/static", express.static(stat));