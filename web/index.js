var http = require('http');
var express = require('express');
var app = express();
var meter = require("./meter");
var xmlparser = require('express-xml-bodyparser');
var bodyParser = require('body-parser');
var jade = require('jade');
var data = require('./data');
var path = require('path');

var server = http.createServer(app).listen(5000);


app.use('/assets', express.static(path.join(__dirname, '/assets')));
app.use('/bower_components', express.static(path.join(__dirname, '/bower_components')));
app.set('view engine', 'jade');
app.use(bodyParser());

var Meter = new meter();
app.post("/meter", xmlparser(), function (req, res) {
    Meter.event(req.body);
    res.end();
});
app.get("/", function(req, res) {
    res.render("index");
});
app.get("/meter", function (req, res) {
    Meter.get("-1 hour", res);
});

app.get('/data', function(req, res) {
    if(!req.query.start) {
        console.error("Start timestamp required.");
    } else {
        data.get(req.query.start, res);
    }
});