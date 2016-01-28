import temperature
from pymongo import MongoClient
import ecobee
import datetime

client = MongoClient('localhost')

db = client.house
temps = db.temps

weather = temperature.GetWeather()
ecobee = ecobee.Ecobee()

data = {}

for sensor in ecobee['thermostatList'][0]['remoteSensors']:
    name = sensor["name"].replace(" ", "_").lower()
    temp = float(sensor["capability"][0]["value"]) / 10

    data[name] = temp

data["outside"] = weather
data["date"] = datetime.datetime.utcnow()
temps.insert_one(data)
