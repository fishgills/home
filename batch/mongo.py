from pymongo import MongoClient
client = MongoClient('192.168.99.100', 32768)

db = client.house

def SaveWeather(data):
    weathers = db.weathers
    weathers.insert_one(data)

def SaveEco(data):
    eco = db.ecos
    eco.insert_one(data)