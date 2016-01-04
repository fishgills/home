from flask import request, Flask, jsonify
import alexa
import ecobee

app = Flask(__name__)
app.debug = True


@app.route('/eco', methods=["POST", "GET"])
def ecobee():
    app.logger.info("Received Ecobee Request")
    app.logger.debug(request.json)
    resp = alexa.event_handler(request.json)
    return jsonify(**resp)

@app.route('/<path:path>', methods=["POST", "GET"])
def catch_all(path):
    app.logger.debug("Path is: %s" % path)
    app.logger.debug(request.json)
    return 'You want path: %s' % path

if __name__ == '__main__':
    app.run()
