from flask import request, Flask, jsonify
import alexa
import ecobee

app = Flask(__name__)
app.debug = True

ECSession = ecobee.Session()
ECSession.start()

EC3 = ecobee.Thermostat(ECSession)

@app.route('/eco', methods=["POST", "GET"])
def ecobee():
    app.logger.info("Received Ecobee Request")
    app.logger.debug(request.json)
    parameters = alexa.request(request.json)
    if parameters == False:
        return ('', 202)
    temp = getattr(EC3, parameters[0])(**parameters[1])
    alexaResp = alexa.response(parameters[1]["Room"], temp)
    resp = jsonify(**alexaResp)
    return resp

@app.route('/<path:path>', methods=["POST", "GET"])
def catch_all(path):
    app.logger.debug("Path is: %s" % path)
    app.logger.debug(request.json)
    return 'You want path: %s' % path

if __name__ == '__main__':
    app.run()
