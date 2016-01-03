import requests
import os.path
import json


class Thermostat():
    def __init__(self, Session):
        self.Session = Session
        self.url = "https://api.ecobee.com/1/"

        self.UpdateThermostats()

    def UpdateThermostats(self):
        jsonToSend = {
            "selection": {
                "selectionType": "registered",
                "selectionMatch": "",
                "includeSensors": True
            }
        }
        self.House = self.DoRequest("thermostat", jsonToSend)["thermostatList"][0]

    def GetTemp(self, Room="bathroom"):
        self.UpdateThermostats()

        # self.app.logger.info("Getting temperature: %s" * Room)
        for sensor in self.House["remoteSensors"]:
            if sensor["name"].lower() == Room:
                for capability in sensor["capability"]:
                    if capability["type"] == "temperature":
                        return float(capability["value"]) / 10


    def DoRequest(self, target, jsonToSend, type="get"):

        payload = {
            "json": json.dumps(jsonToSend)
        }

        headers = {
            "Authorization": "Bearer " + self.Session.token["access_token"],
            "Content-type": "text/json"
        }

        try:
            if type == "get":
                response = requests.get(self.url + target, payload, headers=headers).json()
            else:
                response = requests.post(self.url + target, payload, headers=headers).json()
        except requests.exceptions.RequestException as e:
            print e
        return response


class Session():
    def __init__(self):
        self.url = "https://api.ecobee.com/"
        self.key = "0tou3KS7hqwNksZorliHE0CnbYwT7BkY"
        self.scope = "smartRead"
        self.code = False
        self.token = {}

    def DoRequest(self, target, payload, type="get"):

        try:
            if type == "get":
                response = requests.get(self.url + target, payload).json()
            else:
                response = requests.post(self.url + target, payload).json()
        except requests.exceptions.RequestException as e:
            print e
        print "Request response:"
        print json.dumps(response, indent=4)

        return response

    def Refresh(self):
        payload = {
            "grant_type": "ecobeePin",
            "code": self.code,
            "client_id": self.key
        }
        response = self.DoRequest("token", payload, "post")
        self.token = response
        self.SaveToken()

    def SaveToken(self):
        with open("token.txt", "w") as token_file:
            token_file.write(json.dumps(self.token))

    def GetToken(self):
        if not os.path.isfile("token.txt"):
            return False
        with open("token.txt", "r") as token_file:
            self.token = json.loads(token_file.read())

    def SaveCode(self):
        with open("code.txt", "w") as code_file:
            code_file.write(self.code)
            print "Wrote code"

    def GetCode(self):
        if not os.path.isfile("code.txt"):
            return False
        with open("code.txt", "r") as code_file:
            self.code = code_file.read()

    def GetPin(self):
        payload = {
            "response_type": "ecobeePin",
            "client_id": self.key,
            "scope": self.scope
        }
        response = self.DoRequest("authorize", payload)

        self.sessionInterval = response['interval']
        self.code = response['code']
        self.SaveCode()

        print "Need to authorize with code: %s" % response['ecobeePin']

    def start(self):
        self.GetCode()
        self.GetToken()

        if not self.code:
            self.GetPin()
            raw_input("Press a key once authorized...")
        if not self.token:
            self.Refresh()


if __name__ == "__main__":
    Test = Session()
    Test.start()

    ec = Thermostat(Test)
    print ec.GetTemp("living room")
    print ec.GetTemp("baby room")
    print ec.GetTemp("bedroom")
