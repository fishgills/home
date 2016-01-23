//Lets require/import the HTTP module
var http = require('http');
var express = require('express');
var app = express();
var meter = require("./meter");
var xmlparser = require('express-xml-bodyparser');
var bodyParser = require('body-parser');
//var child_process = require("child_process");

var server = http.createServer(app).listen(5000);


app.use('/assets', express.static('assets'));
app.use(bodyParser());

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
        console.log("Retrieving data");
        var string = child_process.execSync("rrdtool fetch meter.rrd AVERAGE -r 30s --end now --start end-30m");
        var points = [];
        string.toString().split("\n").forEach(function (ele) {
            var data = ele.split(" ");
            var kwh = parseFloat(data[1]);
            var ts = parseInt(data[0]);
            if(!kwh) return;
            if(!ts) return;
            var ts = new Date(parseInt(data[0]) * 1000).toISOString();
            points.push([ts,kwh]);
        });
        var response = {};
        response.series = [{
            "name": "Energy",
            data: points
        }];
        response.x_axis = {};
        response.x_axis.type = "datetime";
        res.json(response);
    } catch(e) {
        console.log("rrd error: ", e);
        res.json(e);
    }
});
