import json
def request(data):
    intent = data["request"]["intent"]
    method = intent["name"]

    arguments = {}

    for slot in intent["slots"]:
        arguments[slot] = intent['slots'][slot]['value']


    return [intent['name'], arguments]