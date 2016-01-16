//Lets require/import the HTTP module
var http = require('http');
var express = require('express');
var app = express();
var dispatcher = require('httpdispatcher');
var AlexaSkill = require('./AlexaSkill');
var api = require('./ecobee-api.js');
var query = require('cli-interact').getYesNo;
var config = require('./config');
var sonos = require("./sonos");
var meter = require("./meter");
var xmlparser = require('express-xml-bodyparser');
var bodyParser = require('body-parser');
var rrd = require('./node_rrd/lib/rrd');
var path = require('path');
var child_process = require("child_process");

if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

var server = http.createServer(app).listen(5000);

app.use('/assets', express.static('assets'));
app.use(bodyParser());
try {
    var refresh_token = JSON.parse(localStorage.getItem("tokens")).refresh_token;
} catch (e) {
    var refresh_token = false;
}

api.calls.refresh(refresh_token, function (err, result) {
    if (err) {
        console.log("Token refresh failed, starting from scratch.");
        localStorage.clear();
        api.calls.getPin(config.appKey, config.scope, function (err, pinResults) {
            if (err) {
                console.log("Unable to get pin:", err);
            }
            else {
                console.log("Received a new pin.");
                localStorage.setItem("authcode", pinResults.code);
                localStorage.setItem("pin", pinResults.ecobeePin);
                localStorage.setItem("interval", pinResults.interval);
                query("Please enter: " + localStorage.getItem("pin"));
                api.calls.registerPin(config.appKey, localStorage.getItem("authcode"), function (err, registerResultObject) {
                    if (err) {
                        console.log("Unable to register pin.", err);
                    } else {
                        localStorage.setItem("tokens", JSON.stringify(registerResultObject));
                        console.log("Refresh token received.");
                    }
                });
            }
        });
    } else {
        localStorage.setItem("tokens", JSON.stringify(result));
        console.log("Token refresh not needed.");
    }
});

var EchoBee = function () {
    AlexaSkill.call(this);
};

EchoBee.prototype = Object.create(AlexaSkill.prototype);
EchoBee.prototype.constructor = EchoBee;

EchoBee.prototype.intentHandlers = {
    GetTemp: function (intent, session, response) {
        console.log("Get Temperature Intent Received: ", intent.slots.Room.value);
        var thermostatSummaryOptions = new api.ThermostatSummaryOptions();
        thermostatSummaryOptions.includeSensors = true;
        api.calls.thermostats(JSON.parse(localStorage.getItem("tokens")).access_token, thermostatSummaryOptions, function (err, result) {
            console.log(result);
            var found = false;
            result.thermostatList[0].remoteSensors.forEach(function (ele) {
                if (ele.name.toLowerCase() == intent.slots.Room.value) {
                    ele.capability.forEach(function (capability) {
                        if (capability.type == "temperature") {
                            response.tellWithCard("The temperature in the " + intent.slots.Room.value + " is " + capability.value / 10 + " degrees.", "EcoBee Temperature", "The temperature in the " + intent.slots.Room.value + " is " + capability.value / 10 + " degrees.");
                            found = true;
                        }
                    });
                }
            });
            if (!found) {
                response.ask("The room was not found.", "Please try again.");
            }
        });
    }
};

var echoBee = new EchoBee();

app.post("/eco", function (req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    echoBee.execute(req.body, res);
});

var EchoSonos = new sonos();

app.post("/sonos", function (req, res) {
    res.writeHead(200, {
        'Content-Type': 'application/json'
    });
    EchoSonos.execute(req.body, res);
});

var Meter = new meter();
app.post("/meter", xmlparser(), function (req, res) {
    Meter.event(req.body);
    res.end();
});
app.get("/meter", function (req, res) {
    var end = Math.floor(Date.now() / 1000);
    var start = end - (60 * 60);
    if (req.query.start)
        start = req.query.start;
    if (req.query.end)
        end = req.query.end;

    try {
        var string = child_process.execSync("rrdtool fetch meter.rrd AVERAGE --start " + start + " --end " + end);
        var points = [];
        string.toString().split("\n").forEach(function (ele) {
            var data = ele.split(" ");
            if (!data[0])
                return;
            points.push({
                ts: data[0],
                kwh: data[1]
            })
        });
        res.json(points);
    } catch(e) {
        console.log("rrd error: ", e);
    }
});

app.get("/", function (req, res) {
    res.sendFile(path.join(__dirname  + "/index.html"));
});
