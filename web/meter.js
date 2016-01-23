//var fs = require("fs");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost/house");

var ReadingSchema = new Schema({
	date: { type: Date, default: Date.now },
	kwh: Number
});
var Reading = mongoose.model("Reading", ReadingSchema);



var MeterHandler = function() {};

MeterHandler.prototype._message = function(data) {
	this.message(data);
}

MeterHandler.prototype.message = function(data) {
	console.log("Override this for:", this.constructor.name);
}

function Meter() {
}

Meter.prototype.handlers = {};
Meter.prototype.handlers.instantaneousdemand = new MeterHandler();
Meter.prototype.handlers.instantaneousdemand.message = function(data) {
	var data = data[0];
	var multiplier = parseInt(data.multiplier[0], 16);
	var divisor = parseInt(data.divisor[0], 16);

	var demand = parseInt(data.demand[0], 16);
	if(divisor > multiplier) {
		var total = demand / divisor;
	} else {
		var total = demand * multiplier;
	}
	var point = {
		ts: parseInt(data.timestamp[0], 16),
		power: total
	}
	console.log("Updating meter: ", point.power+" kwh");
	var reading = new Reading({
		kwh: point.power
	});
	reading.save();
}


Meter.prototype.event = function(xml) {
	var self = this;
    for(var key in xml.rainforest) {
    	if(key == "$") {
    		continue;
    	}
    	if(!Meter.prototype.handlers.hasOwnProperty(key)) {
    		// console.error(key, "does not have a handler");
    		return;
    	}
    	Meter.prototype.handlers[key]._message(xml.rainforest[key]);
    }
};

module.exports = Meter;