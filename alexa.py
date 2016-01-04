import json
def request(data):
    if data["request"]["type"] == "SessionEndedRequest":
        return False
    intent = data["request"]["intent"]

    arguments = {}

    for slot in intent["slots"]:
        arguments[slot] = intent['slots'][slot]['value']

    return [intent['name'], arguments]

def response(room, temp):
    speech = {
        "type": "PlainText",
        "text": "The temperature in %s is %s degrees." % (room, temp)
    }
    response = {}
    response["response"] = {
        "outputSpeech": speech,
        "shouldEndSession": True
    }
    response["version"] = "1.0"

    return response
