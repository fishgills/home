import temperature
from pymongo import MongoClient
import ecobee

client = MongoClient('192.168.1.2')

db = client.house
temps = db.temps

weather = temperature.GetWeather()
ecobee = ecobee.Ecobee()

data = {}

def kelvinToF(kelvin):
    return (kelvin - 273.15) * 1.8 + 32

for sensor in ecobee['thermostatList'][0]['remoteSensors']:
    name = sensor["name"].replace(" ", "_").lower()
    temp = float(sensor["capability"][0]["value"]) / 10

    data[name] = temp

data["outside"] = kelvinToF(weather["main"]["temp"])

temps.insert_one(data)
