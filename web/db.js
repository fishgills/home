var exports = module.exports = {};

var mongoose = require("mongoose");
var Schema = mongoose.Schema;

mongoose.connect("mongodb://localhost/house");

var ReadingSchema = new Schema({
    date: {
        type: Date,
        default: Date.now
    },
    kwh: Number
});
var Reading = mongoose.model("Reading", ReadingSchema);

var TempSchema = new Schema({
    baby_room: Number,
    upstairs: Number,
    living_room: Number,
    master_bedroom: Number,
    outside: Number,
    date: {
        type: Date,
        default: Date.now
    }
});

var Temp = mongoose.model("Temp", TempSchema);
exports.Reading = Reading;
exports.Temp = Temp;