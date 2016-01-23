import urllib, json

def GetWeather():
    url = "http://api.openweathermap.org/data/2.5/weather?lat=37.275633299999996&lon=-121.8116943&appid=42a4c521005ec33589ed50467463fee6"

    response = urllib.urlopen(url)
    data = json.loads(response.read())
    return data