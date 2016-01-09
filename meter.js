var parseString = require("xml2js").parseString;
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
Meter.prototype.handlers.InstantaneousDemand = new MeterHandler();
Meter.prototype.handlers.InstantaneousDemand.message = function(data) {
	var data = data[0];
	var multiplier = parseInt(data.Multiplier[0], 16);
	var divisor = parseInt(data.Divisor[0], 16);

	var demand = parseInt(data.Demand[0], 16);
	if(divisor > multiplier) {
		var total = demand / divisor;
	} else {
		var total = demand * multiplier;
	}
	var point = {
		ts: parseInt(data.TimeStamp[0], 16),
		power: total
	}
	console.log(point);
}


Meter.prototype.event = function(xml) {
	var self = this;
	parseString(xml, function (err, result) {
	    for(var key in result.rainforest) {
	    	if(key == "$") {
	    		continue;
	    	}
	    	if(!Meter.prototype.handlers.hasOwnProperty(key)) {
	    		console.error(key, "does not have a handler");
	    		return;
	    	}
	    	Meter.prototype.handlers[key]._message(result.rainforest[key]);
	    }
	});
};

module.exports = Meter;