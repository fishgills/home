import requests
import ConfigParser
import shelve
import json
import logging

s = shelve.open("home", writeback=True)
Config = ConfigParser.ConfigParser()
Config.read("config.ini")


def MakeRequest(path, params, customHeaders=False, method=None):

    headers = {
        "Accept": "application/json"
    }
    headers.update(customHeaders or {})
    if method == "get":
        r = requests.get(Config.get("ecobee", "url") + path, params=params, headers=headers)
    else:
        headers.update({
            "Content-Type": "application/x-www-form-urlencoded"
        })
        r = requests.post(Config.get("ecobee", "url") + path, params=params, headers=headers)

    if r.status_code != 200:
        logging.error("Requests error")
        logging.error(r.text)
        return False
    return r.json()


def GetPin():
    params = {
        "response_type": "ecobeePin",
        "scope": Config.get("ecobee", "scope"),
        "client_id": Config.get("ecobee", "appKey")
    }

    return MakeRequest("/authorize", params, method="get")


def RegisterPin(auth_code):
    params = {
        "code": auth_code,
        "client_id": Config.get("ecobee", "appKey"),
        "grant_type": 'ecobeePin'
    }

    return MakeRequest("/token", params)
def Refresh(refresh_token):
    data = {
        "grant_type": "refresh_token",
        "code": refresh_token,
        "client_id": Config.get("ecobee", "appKey")
    }
    return MakeRequest("/token", data)

def Thermostats():
    options = {
        "selection": {
            "selectionType" :"registered",
            "selectionMatch" : "",
            "includeSensors" : True
        }
    }
    data = {
        "json": json.dumps(options),
        "token": s["tokens"]["access_token"]
    }

    headers = {
        "Authorization": "Bearer " + s["tokens"]["access_token"]
    }

    return MakeRequest("/1/thermostat", method="get", params=data, customHeaders=headers)


def Ecobee():
    if "tokens" in s:
        refresh_token = s["tokens"]["refresh_token"] or False
    else:
        refresh_token = False

    refresh = Refresh(refresh_token)
    if refresh == False:
        logging.info("Token refresh failed, starting from scratch")
        pin = GetPin()
        if pin == False:
            logging.error("Unable to get pin")
        else:
            logging.info("Received new pin")
            s["authcode"] = pin["code"]
            s["pin"] = pin["ecobeePin"]
            s["interval"] = pin["interval"]
            print pin["ecobeePin"]
            raw = raw_input("Continue?")
            token = RegisterPin(pin["code"])
            if token == False:
                logging.error("Unable to register pin")
            else:
                s["tokens"] = token
                logging.info("Refresh token received. All done.")
    else:
        s["tokens"] = refresh
        ecobee = Thermostats()
        s.close()
        return ecobee


if __name__ == "__main__":
    print Ecobee()