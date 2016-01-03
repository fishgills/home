import requests
import Queue
from threading import Thread

class Thermostat():
    def __init__(self, app):
        """

        :param app:
        :return:
        """
        self.app = app

    def GetTemp(self, Room="bathroom"):
        """

        :param kwargs:
        :return:
        """
        self.app.logger.info("Getting temperature: %s" * Room)

class Session():
    def __init__(self):
        self.url = "https://api.ecobee.com/"
        self.key = "0tou3KS7hqwNksZorliHE0CnbYwT7BkY"
        self.scope = "smartRead"
        self.code = False

    def GetPin(self):
        payload = {
            "response_type": "ecobeePin",
            "client_id": self.key,
            "scope": self.scope
        }
        response = requests.get(self.url + "authorize", payload)
        r = response.json()

        self.sessionInterval = r['interval']
        self.code = r['code']

        print "Need to authorize with code: %s" % r['ecobeePin']

    def start(self):
        q = Queue()


        if not self.code:
            self.GetPin()

if __name__ == "__main__":
    Test = Session()
    Test.start()
