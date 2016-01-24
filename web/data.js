var exports = module.exports = {};
var strtotime = require('./strtotime');
var db = require('./db');
var perf = require("performance-now");

exports.get = function(date, resp) {
    var t0 = perf();
    var cutoffSeconds = strtotime.strtotime(date) * 1000;
    var cutoff = new Date(cutoffSeconds);
    db.Reading.find({
        date: {
            $gt: cutoff
        }
    }, function (err, readings) {
        var t1 = perf();
        if(!err) {
            db.Temp.find({
                date: {
                    $gt: cutoff
                }
            }, function(err, temps){
                var t2 = perf();
                resp.json({
                    temps: temps,
                    readings: readings,
                    cutoff: cutoff
                });

                console.log("Readings: ", t1 - t0, "Temps: ", t2 - t1);
            })
        }
    });

};