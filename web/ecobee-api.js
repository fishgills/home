var http = require('http')
    , https = require('https')
    , querystring = require('querystring')
    , config = require('./config')
    , ecobee = ecobee || {};


var api = {
    host : config.ecobeeHost,
    port: config.ecobeePort,
    apiRoot :'/1/',
    /**
     * Generic request code for node handles get and post requests currently
     */
    makeRequest : function(options, dataString, isHTTPS, callback) {
        var reqCallback = function(res) {
            var reqData = '';
            res.setEncoding('utf8');

            res.on('data', function (chunk) {
                reqData += chunk;
            });

            req.on('error', function(e) {
                callback(e);
            });

            res.on('end', function() {

                var returnData = null;

                // are we expecting json back?
                if(options.headers && options.headers.Accept && options.headers.Accept === 'application/json') {

                    // try to parse the json, could error if we don't get json back from the server
                    try {
                        returnData = JSON.parse(reqData);
                    } catch(e) {
                        returnData = reqData;
                    }
                } else {
                    returnData = reqData;
                }
                console.log(res.statusCode)
                if(res.statusCode !== 200) {
                    var error = new Error(res.statusCode);
                    error.data = returnData;
                    callback(error);
                } else {
                    callback(null, returnData);
                }

            });
        };

        var req = null;

        options.headers['User-Agent'] =  'demo-api-app';
        if(!options.method || options.method.toLowerCase() === 'get') {
            options.path += '?' + dataString;
            console.log(options.path)
        } else {
            options.headers['Content-Length'] =  dataString.length;
        }

        if(isHTTPS) {
            req = https.request(options, reqCallback);
        } else {
            req = http.request(options, reqCallback);
        }

        if(options.method && options.method.toLowerCase() === 'post') {

            console.log('posting data:' + dataString);
            req.write(dataString);
        }

        // attach listeners for error event to the request
        req.on('error', function(e) {
            console.log('error!!!')
            callback(e);
        });

        req.end();
    },
    /**
     * get a new pin for an application. The Client id is the api key assigned to the
     * application
     */
    getPin : function(client_id, scope, callback) {
        var that = this;
        var options = {
            host: this.host,
            port:this.port,
            path:'/authorize',
            method:'GET',
            headers : {
                Accept:'application/json'
            }
        };

        var data = {
            response_type:'ecobeePin',
            scope: scope,
            client_id:client_id
        };
        var dataString = querystring.stringify(data);
        this.makeRequest(options, dataString, config.isHTTPS, callback);
    },
    /**
     * Attempt to register a pin once the app has been added on the
     * ecobee app portal
     */
    registerPin : function(client_id, auth_code, callback) {
        var that = this;
        var options = {
            host: this.host,
            port:this.port,
            path:'/token',
            method:'POST',
            headers : {
                Accept:'application/json',
                'Content-Type':'application/x-www-form-urlencoded'
            }
        };

        var data = {
            code : auth_code,
            client_id:client_id,
            grant_type: 'ecobeePin'
        };

        var dataString = querystring.stringify(data);
        this.makeRequest(options, dataString, config.isHTTPS, callback);
    },
    /**
     * Register Call to obtain a token from user credentials
     * callback signature callback(error, data)
     */
    register : function(registerOptions, callback) {
        var that = this;

        if(!registerOptions) {
            registerOptions = new ecobee.RegisterOptions();
        }
        var data = {
            response_type:'ecobeeAuthz',
            client_id:registerOptions.appKey,
            scope: registerOptions.scope,
            username : registerOptions.username,
            password : registerOptions.password
        }

        var options = {
            host: this.host,
            port:this.port,
            path:'/authorize',
            method:'POST',
            headers : {
                Accept :'application/json',
                'Content-Type':'application/x-www-form-urlencoded'
            }

        };


        var dataString = querystring.stringify(data);
        this.makeRequest(options, dataString, config.isHTTPS, callback);

    },
    /**
     * Use a refresh token to get a new set of tokens from the server
     */
    refresh : function(refresh_token, callback) {
        var that = this;
        var data = {
            grant_type:'refresh_token',
            code: refresh_token,
            client_id:config.appKey
        }

        var options = {
            host: this.host,
            port:this.port,
            path:'/token',
            method:'POST',
            headers : {
                Accept :'application/json',
                'Content-Type' : 'application/x-www-form-urlencoded'
            }

        };

        var dataString = querystring.stringify(data);
        this.makeRequest(options, dataString, config.isHTTPS, callback);


    },
    /**
     * get the summary for the thermostats associated wtih an account
     * All options are passed in the a ThermostatSummaryOptions object
     */
    thermostatSummary : function(token, thermostatSummaryOptions, callback) {
        if(!thermostatSummaryOptions) {
            thermostatSummaryOptions = new ecobee.thermostatSummaryOptions();
        }



        var data = {
            json : JSON.stringify(thermostatSummaryOptions),
            token : token
        }

        var options = {
            host: this.host,
            port:this.port,
            path:'/' + this.apiRoot + 'thermostatSummary',
            method:'GET',
            headers : {
                Accept :'application/json',
                Authorization : 'Bearer ' + token
            }

        };


        var dataString = querystring.stringify(data);
        this.makeRequest(options, dataString, config.isHTTPS, callback);
    },
    /**
     * get all alerts for a given account. This has not been ported over to node yet
     */
    alerts : function(token, alerts_options, callback) {
        //TODO: port this from jquery to node
        var that = this;

        if(!alerts_options) {
            alerts_options = new ecobee.AlertsOptions();
        }



        // $.ajax({
        // 	data: {
        // 		json : JSON.stringify(alerts_options),
        // 		token : token
        // 	},

        // 	dataType: 'json',

        // 	contentType:'application/json',
        // 	cache: false,
        // 	type: 'GET',
        // 	timeout:30000,
        // 	headers : {
        // 		Authorization : 'Bearer ' + token
        // 	},
        // 	url: ecobee.api.server + ecobee.api.apiRoot + 'alert',

        // 	error: function(req, stat, err) {
        //               try{
        //               	var error = that.createError(req);
        //               	callback(error);
        //               }catch(e){
        //               	callback(new Error('timeout'));
        //                   //var err = new ecobee.api.error.AppError('Exception: '+e);
        //                   //err.setState(args.state);
        //                   //err.postErrorToServer();
        //               }
        //           },

        // 	success: function(data, stat, req) {
        // 		if(!data) {
        // 			callback(new Error('no data returned'));
        // 		} else {
        // 			callback(null, data);
        // 		}
        // 	}
        // });
    },
    /**
     * gets thermostats defined by the ThermostatsOptions object.
     */
    thermostats : function(token, thermostats_options, callback) {

        if(!thermostats_options) {
            thermostats_options = new ecobee.ThermostatsOptions();
        }

        var data = {
            json : JSON.stringify(thermostats_options),
            token : token
        }

        var options = {
            host: this.host,
            port:this.port,
            path: this.apiRoot + 'thermostat',
            method:'GET',
            headers : {
                Accept :'application/json',
                Authorization : 'Bearer ' + token
            }

        };


        var dataString = querystring.stringify(data);
        this.makeRequest(options, dataString, config.isHTTPS, callback);
    },
    /**
     * updates thermostats based on the ThermostatsUpdateOptions object
     * Many common update actions have an associated function which are passed in an array
     * so that multiple updates can be completed at one time.
     * updates are completed in order they appear in the functions array
     */
    updateThermostats : function(token, thermostats_update_options, functions_array, thermostat_object, callback) {
        var that = this;
        if(!thermostats_update_options) {
            thermostats_update_options = new ecobee.ThermostatsUpdateOptions();
        }

        thermostats_update_options.functions = functions_array;

        if(thermostat_object) {
            thermostats_update_options.thermostat = thermostat_object;
        }

        var dataString = JSON.stringify(thermostats_update_options);


        var options = {
            host: this.host,
            port:this.port,
            path:'/' + this.apiRoot + 'thermostat?json=true&token=' + token,
            method:'POST',
            headers : {
                Accept :'application/json',
                Authorization : 'Bearer ' + token,
                'Content-Type' : 'application/json'
            }

        };

        this.makeRequest(options, dataString, config.isHTTPS, callback);
    }
};

ecobee.Options = function(){};

ecobee.Options.prototype = {

};
/**
 * Register options that can be passed to a register call
 */
ecobee.RegisterOptions = function(username, password, appKey, scope) {

    this.username  = username || 'default@default.com';
    this.password = password || 'deadbeef';
    this.appKey = config.appKey || 'defaultappkey';
    this.scope = config.scope || 'smart';
};
/**
 * Alert options that can control how the alerts call functions
 */
ecobee.AlertsOptions = function() {

    var ms_day 			= 86400000,
        number_of_days 	= 31,
        go_back_by 		= number_of_days * ms_day,
        end_date 		= new Date(),
        start_date 		= new Date(end_date.getTime() - go_back_by);

    this.startDate = start_date.getFullYear()+'-'+(start_date.getMonth()+1)+'-'+start_date.getDate();
    this.endDate = end_date.getFullYear()+'-'+(end_date.getMonth()+1)+'-'+end_date.getDate();
    this.selection = {
        selectionType:'managementSet',
        selectionMatch:'/'
    };


    function validate(date) {

    }
};
/**
 * Thermostat Options which control how the thermostat call functions
 */
ecobee.ThermostatsOptions = function(thermostat_ids) {

    this.selection = {
        selectionType : 'thermostats',
        selectionMatch : thermostat_ids,
        includeEvents : true,
        includeProgram : true,
        includeSettings : true,
        includeRuntime : true,
        includeAlerts : true,
        includeWeather : true
    }


};
/**
 * update options that control how the thermostats update call behaves
 * Functions get pushed into the functions array which are defined
 * farther down.
 */
ecobee.ThermostatsUpdateOptions = function(thermostat_ids) {

    this.selection = {
        selectionType : 'thermostats',
        selectionMatch : thermostat_ids
    };

    this.functions = [];


};
/**
 * options to pass to the summary call
 */
ecobee.ThermostatSummaryOptions = function() {
    this.selection = {

        selectionType: 'registered',
        selectionMatch : null,
        includeSensors: true
    }
};
/**
 * Function passed to the thermostatsUpdate call to resume a program.
 */
ecobee.ResumeProgramFunction = function() {
    this.type = 'resumeProgram'
}
/**
 * Function passed to the thermostatsUpdate call to send a message to the thermostat
 */
ecobee.SendMessageFunction = function(text) {

    this.type  = 'sendMessage';
    this.params = {
        text: text
    };
};
/**
 * Function passed to the thermostatsUpdate call to acknowledge an alert
 */
ecobee.AcknowledgeFunction = function(thermostat_id, acknowledge_ref, acknowledge_type, remind_later) {

    this.type = 'acknowledge';

    this.params = {
        thermostatIdentifier : thermostat_id,
        ackRef : acknowledge_ref,
        ackType : acknowledge_type,
        remindMeLater : remind_later
    }

    //Values for ack_type: accept, decline, defer, unacknowledged.



}
/**
 * Function passed to the thermostatsUpdate set the occupied state of the thermostat
 * EMS only.
 */
ecobee.SetOccupiedFunction = function(is_occupied, hold_type) {
    this.type = 'setOccupied';
    this.params = {
        occupied : is_occupied,
        holdType : hold_type
    }
};
/**
 * Function passed to the thermostatsUpdate call to set a temperature hold. Need to pass both
 * temperature params.
 */
ecobee.SetHoldFunction = function(cool_hold_temp, heat_hold_temp, hold_type, hold_hours) {
    this.type = 'setHold';

    this.params = {
        coolHoldTemp : cool_hold_temp,
        heatHoldTemp : heat_hold_temp,
        holdType : hold_type
    }

    if(hold_type === 'holdHours') {
        this.params.holdHours = hold_hours;
    }
}
/**
 * get the hierarchy for EMS thermostats based on the node passed in
 * default node is the root level. EMS Only.
 */
ecobee.ManagementSet = function(node) {
    this.selection = {

        selectionType: 'managementSet',
        selectionMatch : node || '/'
    }

}
/**
 * Object that represents a climate.
 */
ecobee.ClimateObject = function(climate_data) {
    return {
        name : climate_data.name,
        climateRef : climate_data.climateRef,
        isOccupied : climate_data.isOccupied,
        coolFan : climate_data.coolFan,
        heatFan : climate_data.heatFan,
        vent : climate_data.vent,
        ventilatorMinOnTime : climate_data.ventilatorMinOnTime,
        owner : climate_data.owner,
        type : climate_data.type,
        coolTemp : climate_data.coolTemp,
        heatTemp : climate_data.heatTemp
    }
}
/**
 * Represents a program and various actions that can be performed on one
 */
ecobee.ProgramObject = function(schedule_object, climates_array) {
    return {
        schedule : schedule_object,
        climates : climates_array,
        getProgram : function() {
            return {
                schedule : this.schedule.schedule,
                climates : this.climates
            };
        },
        validate : function() {
            var climateHash = {},
                climateIndex,
                dayIndex,
                timeIndex;

            for(climateIndex in this.climates) {
                if(climateHash[this.climates[climateIndex].climateRef]) {
                    throw new Error('duplicate climate refs exist: ' + this.climates[climateIndex].climateRef);
                }
                climateHash[this.climates[climateIndex].climateRef] = true;
            }

            for(dayIndex in schedule) {
                for(timeIndex in shedule[dayIndex]) {
                    if(!climateHash[schedule[dayIndex][timeIndex]]) {
                        throw new Error('invalid program. ' + schedule[dayIndex][timeIndex] + ' climate does not exist');
                    }
                }
            }

            return true;
        }
    }
}
/**
 * holds the schedule that goes with a program. Each item in the schedule array is a string climateRef that points
 * to a climate obnject
 */
ecobee.ScheduleObject = function(scheduleArray) {

    return {schedule : scheduleArray || [
        [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null],
        [null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null]
    ],
        getSchedule : function() {
            return this.schedule;
        },
        updateScheduleNode : function(dayIndex, timeIndex, climateRef) {

            this.schedule[dayIndex][timeIndex] = climateRef;
        },
        getScheduleNode : function(dayIndex, timeIndex) {
            return this.shedule[dayIndex][timeIndex];
        }
    };
};
exports.ScheduleObject = ecobee.ScheduleObject;
exports.ProgramObject = ecobee.ProgramObject;
exports.ClimateObject = ecobee.ClimateObject;
exports.ManagementSet = ecobee.ManagementSet;
exports.SetHoldFunction = ecobee.SetHoldFunction;
exports.SetOccupiedFunction = ecobee.SetOccupiedFunction;
exports.AcknowledgeFunction = ecobee.AcknowledgeFunction;
exports.SendMessageFunction = ecobee.SendMessageFunction;
exports.ResumeProgramFunction = ecobee.ResumeProgramFunction;
exports.ThermostatsOptions = ecobee.ThermostatsOptions;
exports.ThermostatSummaryOptions = ecobee.ThermostatSummaryOptions;
exports.BreadCrumbOptions = ecobee.BreadCrumbOptions;
exports.ThermostatsUpdateOptions = ecobee.ThermostatsUpdateOptions;
exports.AlertsOptions = ecobee.AlertsOptions;
exports.RegisterOptions = ecobee.RegisterOptions;
exports.calls = api;

