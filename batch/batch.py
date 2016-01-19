import temperature
import mongo
import ecobee

weather = temperature.GetWeather()
mongo.SaveWeather(weather)

ecobee = ecobee.Ecobee()
mongo.SaveEco(ecobee)