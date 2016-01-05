//Lets require/import the HTTP module
var http = require('http');
var dispatcher = require('httpdispatcher');
var AlexaSkill = require('./AlexaSkill');
var api = require('./ecobee-api.js');
var	query = require('cli-interact').getYesNo;
var config = require('./config');
if (typeof localStorage === "undefined" || localStorage === null) {
    var LocalStorage = require('node-localstorage').LocalStorage;
    localStorage = new LocalStorage('./scratch');
}

//Lets define a port we want to listen to
const PORT=8080;

//We need a function which handles requests and send response
function handleRequest(request, response){
    try {
        //log the request on console
        console.log(request.url);
        //Disptach
        dispatcher.dispatch(request, response);
    } catch(err) {
        console.log(err);
    }
}
//Create a server
var server = http.createServer(handleRequest);

//Lets start our server
server.listen(PORT, function(){
    //Callback triggered when server is successfully listening. Hurray!
    console.log("Server listening on: http://localhost:%s", PORT);
});


//For all your static (js/css/images/etc.) set the directory name (relative path).
dispatcher.setStatic('resources');

try {
    var refresh_token = JSON.parse(localStorage.getItem("tokens")).refresh_token;
} catch (e) {
    var refresh_token = false;
}

api.calls.refresh(refresh_token, function(err, result) {
   if(err) {
       console.log("Token refresh failed, starting from scratch.");
       localStorage.clear();
       api.calls.getPin(config.appKey, config.scope, function(err, pinResults) {
           if(err) {
               console.log("Unable to get pin:", err);
           }
           else {
               console.log("Received a new pin.");
               localStorage.setItem("authcode", pinResults.code);
               localStorage.setItem("pin", pinResults.ecobeePin);
               localStorage.setItem("interval", pinResults.interval);
               query("Please enter: " + localStorage.getItem("pin"));
               api.calls.registerPin(config.appKey, localStorage.getItem("authcode"), function(err, registerResultObject) {
                   if(err) {
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
////A sample GET request
//dispatcher.onGet("/eco", function(req, res) {
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//    res.end('Page One');
//});

var EchoBee = function () {
    AlexaSkill.call(this);
};

EchoBee.prototype = Object.create(AlexaSkill.prototype);
EchoBee.prototype.constructor = EchoBee;

EchoBee.prototype.intentHandlers = {
    GetTemp: function(intent, session, response) {
        console.log("Get Temperature Intent Received: ", intent.slots.Room.value);
        var thermostatSummaryOptions = new api.ThermostatSummaryOptions();
        thermostatSummaryOptions.includeSensors = true;
        api.calls.thermostats(JSON.parse(localStorage.getItem("tokens")).access_token, thermostatSummaryOptions, function(err, result) {
            console.log(result);
            var found = false;
            result.thermostatList[0].remoteSensors.forEach(function(ele) {
                if(ele.name.toLowerCase() == intent.slots.Room.value) {
                    ele.capability.forEach(function(capability) {
                       if(capability.type == "temperature") {
                           response.tell("The temperature in the " + intent.slots.Room.value + " is " + capability.value / 10 + " degrees.");
                           found = true;
                       }
                    });
                }
            });
            if(!found) {
                response.ask("The room was not found.", "Please try again.");
            }
        });
    }
};

var echoBee = new EchoBee();

dispatcher.onPost("/eco", function(req, res) {
    res.writeHead(200, {'Content-Type': 'application/json'});

    echoBee.execute(JSON.parse(req.body), res);
});