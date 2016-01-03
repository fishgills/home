from flask import Flask
from flask import request
import alexa
import ecobee

app = Flask(__name__)
app.debug = True

ECSession = ecobee.Session()
ECSession.start()

EC3 = ecobee.Thermostat(ECSession)

@app.route('/eco', methods=["POST", "GET"])
def ecobee():
    parameters = alexa.request(request.json)
    getattr(EC3, parameters[0])(**parameters[1])

@app.route('/<path:path>', methods=["POST", "GET"])
def catch_all(path):
    app.logger.debug("Path is: %s" % path)
    app.logger.debug(request.json)
    return 'You want path: %s' % path

if __name__ == '__main__':
    app.run()
