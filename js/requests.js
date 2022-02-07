const BASE_URL = {
  dev: "http://127.0.0.1:8080/api",
  pro: "https://0.0.0.0/api"
}.dev;

export function request(config) {
  return $.ajax(config);
}

//得到黄历信息
export function getHuangLi(date = "20211111") {
  return request({
    type: "POST",
    url: `${BASE_URL}/v2/standard/common/getHuangli`,
    contentType: "application/json;charset=UTF-8",
    dataType: "json",
    data: JSON.stringify({
      appName: "HOLI_WEATHER_BONIU",
      deviceType: "ANDROID",
      uuid: "7a8362dc-7d99-4517-9938-61eecfd88465",
      solarDate: date
    })
  })
}

//城市搜索
export function locations(q = "") {
  return request({
    url: `${BASE_URL}/v1/locations/v1/cities/search.json`,
    dataType: "json",
    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    data: {
      alias: "Always",
      apiKey: "srRLeAmTroxPinDG8Aus3Ikl6tLGJd94",
      language: "zh-cn",
      q: q
    }
  })
}

//天气警告信息
export function alerts(cityKey = "") {
  return request({
    url: `${BASE_URL}/v1/alerts/v1/${cityKey}`,
    dataType: "json",
    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    data: {
      apiKey: "7f8c4da3ce9849ffb2134f075201c45a",
      language: "zh-cn",
      details: true
    }
  })
}

//城市空气信息
export function airQuality(cityKey = "") {
  return request({
    url: `${BASE_URL}/v1/airquality/v1/observations/${cityKey}`,
    dataType: "json",
    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    data: {apiKey: "7f8c4da3ce9849ffb2134f075201c45a"}
  })
}

//城市当前天气(空气,温度等)信息
export function currentConditions(cityKey = "") {
  return request({
    url: `${BASE_URL}/v1/currentconditions/v1/${cityKey}`,
    dataType: "json",
    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    data: {
      apiKey: "131778526309453295c9ce2350a79e87",
      language: "zh-cn",
      details: true
    }
  })
}

//城市未来24小时天气信息
export function forecasts24H(cityKey = "") {
  return request({
    url: `${BASE_URL}/v1/forecasts/v1/hourly/24hour/${cityKey}`,
    dataType: "json",
    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    data: {
      apiKey: "srRLeAmTroxPinDG8Aus3Ikl6tLGJd94",
      language: "zh-cn",
      details: true,
      metric: true
    }
  })
}

//城市未来10天天气信息
export function forecasts10D(cityKey = "") {
  return request({
    url: `${BASE_URL}/v1/forecasts/v1/daily/10day/${cityKey}`,
    dataType: "json",
    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
    data: {
      apiKey: "srRLeAmTroxPinDG8Aus3Ikl6tLGJd94",
      language: "zh-cn",
      details: true,
      metric: true
    }
  })
}