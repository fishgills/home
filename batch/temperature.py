import urllib, json

def GetWeather():
    url = "http://api.openweathermap.org/data/2.5/weather?lat=37.275633299999996&lon=-121.8116943&appid=2de143494c0b295cca9337e1e96b00e0"

    response = urllib.urlopen(url)
    data = json.loads(response.read())
    return data