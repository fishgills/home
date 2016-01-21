from pymongo import MongoClient
client = MongoClient('localhost')

db = client.house

def SaveWeather(data):
    weathers = db.weathers
    weathers.insert_one(data["main"])

def SaveEco(data):
    eco = db.ecos
    eco.insert_one(data["thermostatList"][0])
