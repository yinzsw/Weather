import calendar from "./calendar.js";
import {debounce, dateFormat, getPosition, isMobile, arrayObjectSet} from "./utils.js";
import {request, getHuangLi} from "./requests.js";
import {locations, alerts, airQuality, currentConditions, forecasts24H, forecasts10D} from "./requests.js";

export class AppInit {
  constructor() {
    const searchHistory = [{"key": "101924", "name": "北京", "nameEn": "Beijing", "belong": "北京市"}];
    const background = "linear-gradient(180deg, #245494 0%, #1C4484 100%)";
    [null, "[]"].includes(localStorage.getItem("searchHistory")) && localStorage.setItem("searchHistory", JSON.stringify(searchHistory));
    $("html,body").css("background", localStorage.getItem("background") || background);
  }
}

export class Search {
  constructor(el, elResult) {
    this.el = el;
    this.elResult = elResult;
    this.renderTplDeb = debounce(this.renderTpl, 200);
    this.getTemplates().then(templates => this.templates = templates);
  }

  hide(time = 50) {
    this.elResult.slideUp(time);
    this.el.val("");
  }

  show(time = 250) {
    let timeout = +this.el.css("transition").match(/border-radius (.*?)s/)[1] * 1000;
    setTimeout(() => this.elResult.slideDown(time), timeout);
  }

  locationsFilter(data = []) {
    const belong = (arr, init) => arr.reduce((pre, cur) => pre + cur["LocalizedName"], init["LocalizedName"]);
    return data.map(({AdministrativeArea, Key, LocalizedName, EnglishName, SupplementalAdminAreas}) => new Object({
      key: Key,
      name: LocalizedName,
      nameEn: EnglishName,
      belong: belong(SupplementalAdminAreas, AdministrativeArea)
    }));
  }

  saveInfoToLocal(info = {}) {
    let history = localStorage.getItem("searchHistory") || "[]";
    history = JSON.parse(history);
    history.unshift(info);
    history = arrayObjectSet(history, "key");
    if (history.length > 10) history.pop();
    localStorage.setItem("searchHistory", JSON.stringify(history));
  }

  deleteInfoInLocal(index = 0) {
    let history = localStorage.getItem("searchHistory") || "[]";
    history = JSON.parse(history);
    history.splice(index, 1);
    localStorage.setItem("searchHistory", JSON.stringify(history));
  }

  async getCurrentPositionData() {
    const {latitude, longitude} = await getPosition();
    const data = await locations(`${latitude},${longitude}`);
    return this.locationsFilter(data)[0];
  }

  async getTemplates() {
    const templates = await Promise.all([
      request({url: "./template/searchBefore.html", dataType: "html"}),
      request({url: "./template/searching.html", dataType: "html"})
    ]);
    return templates.map(tpl => template.compile(tpl));
  }

  async renderTpl(type = "") {
    let value = this.el.val().trim();
    if (type === "input" && value.length) {
      let data = await locations(value);
      data = this.locationsFilter(data);
      data.sort((a, b) => a.belong.localeCompare(b.belong))
      let html = this.templates[1]({data})
      this.elResult.html(html);
    } else if (type === "focus") {
      let history = localStorage.getItem("searchHistory") || "[]";
      let html = this.templates[0]({data: JSON.parse(history)});
      this.elResult.html(html);
    }
  }
}

export class SundryBar {
  constructor(el) {
    this.el = el;
  }

  switchUnit(target) {
    target.hasClass("unit-active") || this.el.find(".switch-unit div").toggleClass("unit-active")
  }

  async render() {
    let tpl = await request({url: "./template/sundryBar.html", dataType: "html"});
    let history = localStorage.getItem("searchHistory") || "[]";
    const {name, nameEn, belong} = JSON.parse(history)[0];
    let html = template.compile(tpl)({name, nameEn, belong});
    this.el.html(html);
  }
}

export class Forecasts10dEChars {
  constructor(data) {
    this.el = $("#forecasts10d-echars")[0];
    this.data = data;
    this.init();
  }

  init() {
    const {icon, iconPhrase, water} = this.data
    const xAxisIcon = this.data.icon.reduce((pre, cur) => (pre[cur] = {
      height: 30,
      width: 30,
      align: 'center',
      lineHeight: 45,
      border: "1px solid red",
      backgroundColor: {image: `/img/weatherIcons/${cur}.svg`}
    }, pre), {});
    const label = {
      show: true,
      formatter: "{c}°",
      position: "top",
      textStyle: {color: "#FFFFFF", fontSize: "12", fontWeight: "bolder"}
    };
    const tooltip = {
      trigger: 'axis',
      formatter([item1, item2]) {
        return `<div class="fw-bolder">${item1.name}</div>
                  <div>${item1.marker} ${item1.seriesName} <strong>${item1.value}°</strong></div>
                  <div>${item2.marker} ${item2.seriesName} <strong>${item2.value}°</strong></div>`
      }
    };
    const option = {
      animationDuration: 600,
      backgroundColor: 'rgba(0,0,0,0)',
      grid: {
        left: '-7%',
        right: '-7%',
        bottom: '0',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        axisTick: {show: false},
        axisLine: {
          lineStyle: {
            width: 1,
            type: 'dashed',
            color: 'rgba(255,255,255,.2)'
          }
        },
        axisLabel: {
          color: '#FFF',
          fontSize: 12,
          interval: 0,
          formatter: function (value, index) {
            if ([0, 11].includes(index)) return;
            return `{water| }${water[index]}%\n{${icon[index]}| }\n\n{value|${value}}\n{iconValue|${iconPhrase[index]}}`;
          },
          rich: {
            ...xAxisIcon,
            iconValue: {
              lineHeight: 20,
              opacity: 0.6,
              align: 'center',
            },
            value: {lineHeight: 20, align: 'center'},
            water: {
              height: 16,
              width: 16,
              lineHeight: 20,
              align: 'center',
              backgroundColor: {image: "/img/otherIcons/watermark.svg"}
            }
          },
        },
      },
      yAxis: {
        type: 'value',
        scale: true,
        splitLine: {show: false},
        axisTick: {show: false},
        axisLabel: {show: false}
      },
      series: [
        {
          name: "最高气温",
          type: 'line',
          smooth: true,
          symbolSize: "3",
          itemStyle: {normal: {label, color: "#C12E34"}},
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 1, 0, 0,
                [{offset: 0, color: 'rgba(193,46,52,0)'}, {offset: 1, color: '#C12E34'}])
          }
        },
        {
          name: "最低气温",
          type: 'line',
          smooth: true,
          symbolSize: "3",
          itemStyle: {
            normal: {label, color: "#0098D9"}
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 1, 0, 0,
                [{offset: 0, color: 'rgba(0,152,217,0)'}, {offset: 1, color: '#0098D9'}])
          }
        }
      ]
    };
    if (!isMobile()) option.tooltip = tooltip;
    option.xAxis.data = this.data.title;
    option.series[0].data = this.data.max;
    option.series[1].data = this.data.min;
    const echars10d = echarts.init(this.el, null, {renderer: ['canvas', 'svg'][+isMobile()]});
    echars10d.setOption(option);
    setTimeout(() => new ResizeObserver(() => echars10d.resize()).observe(this.el), 600)
  }
}

export class WeatherInfo {
  constructor() {
    this.bodyEl = $("html,body");
    this.contentEl = $(".content");
    this.warningEl = $("#warning");
    this.todayWeatherEl = $("#today-weather");
    this.todayAlmanacEl = $("#today-almanac");
    this.forecasts24hEl = $("#forecasts24h");
    this.forecasts10dEl = $("#forecasts10d");
    this.moreDetailEl = $("#more-detail");
    this.isMobile = isMobile();
    this.WEATHER_ENUM = {
      1: "晴", 2: "大部晴", 3: "部分晴", 4: "间歇多云", 5: "朦胧晴", 6: "大部多云", 7: "多云", 8: "阴", 11: "雾",
      12: "阵雨", 13: "多云阵雨", 14: "阵雨转晴", 15: "雷雨", 16: "多云雷雨", 17: "雷雨转晴", 18: "雨",
      19: "小雪", 20: "多云小雪", 21: "小雪转晴", 22: "雪", 23: "多云雪", 24: "冻雪", 25: "冰霰",
      26: "冻雨", 29: "雨加雪", 30: "炎热", 31: "寒冷", 32: "大风",
      33: "晴", 34: "大部晴", 35: "部分晴", 36: "间歇多云", 37: "朦胧晴", 38: "大部多云",
      39: "阵雨", 40: "多云阵雨", 41: "雷雨", 42: "多云雷雨", 43: "多云阵雪", 44: "多云雪"
    }
    this.BG_ENUM = {
      sunny: {
        id: [1, 2, 3, 4, 5, 30, 33, 34],
        BG_COLOR: ["linear-gradient(180deg, #245494 0%, #1C4484 100%)", "#1B4E97"],
        BG_COLOR_NIGHT: ["linear-gradient(180deg, #28456E 0%, #142444 100%)", "#071A37"],
        BG_IMG: "Sunny.png",
        BG_IMG_NIGHT: "Clear Night.png"
      },
      rain: {
        id: [12, 13, 14, 18, 39, 40],
        BG_COLOR: ["linear-gradient(180deg, #345C84 0%, #2C4C74 100%)", "#0E2745"],
        BG_COLOR_NIGHT: ["linear-gradient(180deg, #2C466C 0%, #14243C 100%)", "#191C25"],
        BG_IMG: "Rain 2.png",
        BG_IMG_NIGHT: "Rain 1.png",
      },
      snow: {
        id: [19, 20, 21, 22, 23, 24, 25, 26, 29, 31, 43, 44],
        BG_COLOR: ["linear-gradient(180deg, #295793 0%, #0C3C7C 100%)", "#0A397C"],
        BG_COLOR_NIGHT: ["linear-gradient(180deg, #1C2C44 0%, #0B1A2C 100%)", "#021023"],
        BG_IMG: "Snow 2.png",
        BG_IMG_NIGHT: "Snow 1.png",
      },
      cloudy: {
        id: [6, 7, 8, 32, 35, 36, 38],
        BG_COLOR: ["linear-gradient(180deg, #4C5C7A 0%, #344464 100%)", "#41506D"],
        BG_COLOR_NIGHT: ["linear-gradient(180deg, #244D72 0%, #07213B 100%)", "#0E2945"],
        BG_IMG: "Cloudy 2.png",
        BG_IMG_NIGHT: "Cloudy 1.png",
      },
      storm: {
        id: [15, 16, 17, 41, 42],
        BG_COLOR: ["linear-gradient(180deg, #506078 0%, #44546C 100%)", "#40546B"],
        BG_COLOR_NIGHT: ["linear-gradient(180deg, #37314D 0%, #14142C 100%)", "#140C35"],
        BG_IMG: "Thunderstorms 2.png",
        BG_IMG_NIGHT: "Thunderstorms 1.png",
      },
      fog: {
        id: [5, 11, 37],
        BG_COLOR: ["linear-gradient(180deg, #44446C 0%, #2C2C54 100%)", "#302D55"],
        BG_COLOR_NIGHT: ["linear-gradient(180deg, #2D4156 0%, #1A1C24 100%)", "#1C2933"],
        BG_IMG: "Light fog.png",
        BG_IMG_NIGHT: "Hazy Night.png"
      }
    };
    this.AIR_COLOR_ENUM = [
      {grade: "优", color: "#00AE56"},
      {grade: "良", color: "#FFB900"},
      {grade: "轻度污染", color: "#F2610C"},
      {grade: "中度污染", color: "#D13438"},
      {grade: "重度污染", color: "#881798"},
      {grade: "严重污染", color: "#6E220F"},
      {grade: "污染爆表", color: "#202020"}
    ];
    this.MOON_ENUM = {
      New: {moonIcon: 1, name: "新月"},
      WaningCrescent: {moonIcon: 2, name: "残月"},
      Third: {moonIcon: 3, name: "下弦月"},
      Last: {moonIcon: 3, name: "下弦月"},
      WaningGibbous: {moonIcon: 4, name: "亏凸月"},
      Full: {moonIcon: 5, name: "满月"},
      WaxingGibbous: {moonIcon: 6, name: "盈凸月"},
      First: {moonIcon: 7, name: "上弦月"},
      WaxingCrescent: {moonIcon: 8, name: "蛾眉月"}
    };
    this.initTemplates().then();
  }

  async initTemplates() {
    const [warningTpl, todayWeatherTpl, todayAlmanacTpl, forecasts24hTpl, forecasts10dTpl, moreDetailTpl] = await Promise.all([
      request({url: "./template/warning.html", dataType: "html"}),
      request({url: "./template/todayWeather.html", dataType: "html"}),
      request({url: "./template/todayAlmanac.html", dataType: "html"}),
      request({url: "./template/forecasts24h.html", dataType: "html"}),
      request({url: "./template/forecasts10d.html", dataType: "html"}),
      request({url: "./template/moreDetail.html", dataType: "html"}),
    ]);
    this.warningTpl = warningTpl;
    this.todayWeatherTpl = todayWeatherTpl;
    this.todayAlmanacTpl = todayAlmanacTpl;
    this.forecasts24hTpl = forecasts24hTpl;
    this.forecasts10dTpl = forecasts10dTpl;
    this.moreDetailTpl = moreDetailTpl;
  }

  async loadWeatherInfo() {
    const cityKey = JSON.parse(localStorage.getItem("searchHistory"))[0].key;
    const [almanac, warning, todayAir, todayWeather, forecastsHour24, forecastsDay10] = await Promise.all([
      getHuangLi(dateFormat(new Date(), "yyyyMMdd")),
      alerts(cityKey),
      airQuality(cityKey),
      currentConditions(cityKey),
      forecasts24H(cityKey),
      forecasts10D(cityKey),
    ]);

    this.almanac = almanac["result"];
    this.warning = warning;
    this.todayAir = todayAir;
    this.todayWeather = todayWeather[0];
    this.forecastsHour24 = forecastsHour24;
    this.forecastsDay10 = forecastsDay10;

    this.__renderBackgroundStyle();
    this.__renderWarningTpl();
    this.__renderTodayWeatherTpl();
    this.__renderTodayAlmanacTpl();
    this.__renderForecasts24hTpl();
    this.__renderForecasts10dTpl();
    this.__renderMoreDetailTpl();
  }

  showECharsIn10dTpl(unit = "C") {
    const isFUnit = unit === "F";
    const data = {
      title: [''], icon: [''], iconPhrase: [''], water: [''],
      max: [this.forecastsDay10["DailyForecasts"][0]["Temperature"]["Maximum"]["Value"]],
      min: [this.forecastsDay10["DailyForecasts"][0]["Temperature"]["Minimum"]["Value"]]
    }
    for (let i = 0; i < 11; i++) {
      const index = i > 9 ? 9 : i;
      const o = this.forecastsDay10["DailyForecasts"][index];
      let isNowDay = new Date(o["Date"]).getDate() === new Date().getDate();
      data.title.push([`星期${dateFormat(new Date(o["Date"]), "E")}`, "今天"][+isNowDay]);
      data.max.push(o["Temperature"]["Maximum"]["Value"]);
      data.min.push(o["Temperature"]["Minimum"]["Value"]);
      data.icon.push(o["Day"]["Icon"]);
      data.iconPhrase.push(this.WEATHER_ENUM[o["Day"]["Icon"]]);
      data.water.push(o["Day"]["PrecipitationProbability"]);
    }
    if (isFUnit) {
      data.max = data.max.map(item => (item * 1.8 + 32).toFixed(1))
      data.min = data.min.map(item => (item * 1.8 + 32).toFixed(1))
    }
    new Forecasts10dEChars(data)
  }

  __renderBackgroundStyle() {
    const iconId = this.todayWeather["WeatherIcon"];
    const isDayTime = this.todayWeather["IsDayTime"];
    const {BG_COLOR, BG_COLOR_NIGHT, BG_IMG, BG_IMG_NIGHT} = Object.values(this.BG_ENUM).find(o => o.id.includes(iconId));
    const style = {backgroundColor: [BG_COLOR_NIGHT, BG_COLOR], backgroundImage: [BG_IMG_NIGHT, BG_IMG]};
    localStorage.setItem("background", style['backgroundColor'][+isDayTime][0]);
    if (this.isMobile) return this.contentEl.css({
      backgroundColor: `${style["backgroundColor"][+isDayTime][1]}`,
      backgroundImage: `url('/img/backgroundImgMobile/${style["backgroundImage"][+isDayTime]}')`
    });
    this.bodyEl.css("background", style["backgroundColor"][+isDayTime][0]);
    this.todayWeatherEl.css("background", `url('/img/backgroundImg/${style["backgroundImage"][+isDayTime]}')`);
  }

  __renderWarningTpl() {
    const render = template.compile(this.warningTpl);
    const alertColor = {"蓝色": "#3967E4", "黄色": "#FFB900", "橙色": "#F2610C", "红色": "#D13438",}
    const warningInfoList = this.warning.map(o => ({
      color: alertColor[o["Level"]],
      desc: o["Description"]["Localized"],
      text: o["Area"][0]["Text"]
    }));
    const warningHtml = render({warningInfoList});
    this.warningEl.html(warningHtml);
  }

  __renderTodayWeatherTpl() {
    const render = template.compile(this.todayWeatherTpl);
    const isDayTime = this.todayWeather["IsDayTime"];
    const infoTexts = [["今天夜间天气", "。最低气温"], ["今天预计天气", "。最高气温"]][+isDayTime];
    const infoText = infoTexts.join(`${this.forecastsDay10["DailyForecasts"][0][`${["Night", "Day"][+isDayTime]}`]["LongPhrase"]}`);
    const dailyTemperature = this.forecastsDay10["DailyForecasts"][0]["Temperature"][`${["Minimum", "Maximum"][+isDayTime]}`]['Value'];
    const pressureTendencyCode = {"F": "↓", "S": "-", "R": "↑"}[this.todayWeather["PressureTendency"]["Code"]];
    let curAQI = "NA", AQIIndex = "NA";
    if (this.todayAir !== null) {
      curAQI = this.AIR_COLOR_ENUM[[50, 100, 150, 200, 300, 500, Number.MAX_VALUE].findIndex(i => this.todayAir["Index"] <= i)];
      AQIIndex = this.todayAir["Index"]
    }
    const data = {
      obsTime: dateFormat(new Date(this.todayWeather["EpochTime"] * 1000), "hh:mm"),
      iconId: this.todayWeather["WeatherIcon"],
      temperature: this.todayWeather["Temperature"]["Metric"]["Value"],
      weatherText: this.WEATHER_ENUM[this.todayWeather["WeatherIcon"]],
      warning: !!this.warning.length,
      infoText: infoText,
      dailyTemperature: dailyTemperature,
      feelTemperature: this.todayWeather["RealFeelTemperature"]["Metric"]["Value"],
      AQI: curAQI,
      AQIIndex: AQIIndex,
      visibility: this.todayWeather["Visibility"]["Metric"]["Value"],
      wind: this.todayWeather["Wind"]["Speed"]["Metric"]["Value"],
      windDegrees: +this.todayWeather["Wind"]["Direction"]["Degrees"] + 180,
      humidity: this.todayWeather["RelativeHumidity"],
      pressure: `${pressureTendencyCode} ${this.todayWeather["Pressure"]["Metric"]["Value"]}`,
      dewPoint: this.todayWeather["DewPoint"]["Metric"]["Value"]
    }
    const currentHtml = render(data);
    this.todayWeatherEl.html(currentHtml);
  }

  __renderTodayAlmanacTpl() {
    const render = template.compile(this.todayAlmanacTpl);

    const date = new Date();
    const currentYear = calendar.lunar2solar(date.getFullYear(), 1, 1);
    const currentYearTime = new Date(currentYear.cYear, currentYear.cMonth, currentYear.cDay).getTime();
    const nextYear = calendar.lunar2solar(date.getFullYear() + 1, 1, 1);
    const nextYearTime = new Date(nextYear.cYear, nextYear.cMonth, nextYear.cDay).getTime();
    const totalDay = (nextYearTime - currentYearTime) / 1000 / 3600 / 24;
    const passDay = (date.getTime() - currentYearTime) / 1000 / 3600 / 24;
    const surplusPercentage = ((totalDay - passDay) / totalDay * 100).toFixed(2);
    const batteryColor = ["#D13438", "#F2610C", "#FFB900", "#00AE56"][[5, 15, 30, Number.MAX_VALUE].findIndex(i => surplusPercentage <= i)];
    const lunarCalendar = this.almanac["nongli"].split("年").pop();
    const YMD = dateFormat(date, "yyyy.MM.dd");
    const suiCi = JSON.parse(this.almanac["suici"]);
    const suiCiOfYear = suiCi.shift().replace("年", `(${this.almanac["shengxiao"]})年`);
    const data = {
      lunarCalendar,
      YMD,
      suiCi,
      suiCiOfYear,
      totalDay,
      surplusPercentage,
      batteryColor,
      passDay: Math.ceil(passDay),
      week: this.almanac["week"],
      star: this.almanac["star"],
      yi: JSON.parse(this.almanac["yi"]),
      ji: JSON.parse(this.almanac["ji"])
    }
    const almanacHtml = render(data);
    this.todayAlmanacEl.html(almanacHtml);
  }

  __renderForecasts24hTpl() {
    const render = template.compile(this.forecasts24hTpl);
    const future24hList = this.forecastsHour24.map(o => new Object({
      icon: o["WeatherIcon"],
      weatherText: this.WEATHER_ENUM[o["WeatherIcon"]],
      temperature: o["Temperature"]["Value"],
      rainProbability: o["RainProbability"],
      windDegrees: +o["Wind"]["Direction"]["Degrees"] + 180,
      windDirection: o["Wind"]["Direction"]["Localized"],
      windSpeed: o["Wind"]["Speed"]["Value"],
      time: dateFormat(new Date(o["DateTime"]), "hh:ss"),
      feelTemperature: o["RealFeelTemperature"]["Value"],
      humidity: o["RelativeHumidity"],
      UV: o["UVIndex"],
      UVText: o["UVIndexText"],
      visibility: o["Visibility"]["Value"],
      dewPoint: o["DewPoint"]["Value"],
      cloudCover: o["CloudCover"],
      windGust: o["WindGust"]["Speed"]["Value"]
    }));
    const data = {
      future24hList,
      past24Temperature: this.todayWeather["TemperatureSummary"]["Past24HourRange"],
      past24Precipitation: this.todayWeather["PrecipitationSummary"]["Past24Hours"]["Metric"]["Value"]
    };
    const forecasts24hHtml = render(data);
    this.forecasts24hEl.html(forecasts24hHtml);
  }

  __renderForecasts10dTpl() {
    const render = template.compile(this.forecasts10dTpl);
    const html = render({headlineText: this.forecastsDay10["Headline"]["Text"]});
    this.forecasts10dEl.html(html);
    this.showECharsIn10dTpl();
  }

  __renderMoreDetailTpl() {
    const render = template.compile(this.moreDetailTpl);
    const date = new Date();
    const {Sun, Moon} = this.forecastsDay10["DailyForecasts"].find(o => new Date(o["Date"]).getDay() === date.getDay());
    const [sunRiseTime, sunSetTime, moonRiseTime, moonSetTime] = [
      dateFormat(new Date(Sun["Rise"]), "hh:mm"),
      dateFormat(new Date(Sun["Set"]), "hh:mm"),
      dateFormat(new Date(Moon["Rise"]), "hh:mm"),
      dateFormat(new Date(Moon["Set"]), "hh:mm"),
    ];
    const currentTime = date.getTime() / 1000;
    const [sunOffsetDate, moonOffsetDate] = [new Date((Sun["EpochSet"] - Sun["EpochRise"]) * 1000), new Date((Moon["EpochSet"] - Moon["EpochRise"]) * 1000)];
    const inBoundary = (value, min = 0, max = 1) => {
      if (value >= max) return max;
      if (value <= min) return min;
      return value;
    };

    let sunAndMoonData = {
      UV: this.todayWeather["UVIndex"],
      UVText: this.todayWeather["UVIndexText"],
      moon: this.MOON_ENUM[Moon["Phase"]],
      riseSetList: [
        {
          color: "#FEC80A",
          riseText: "日出时间",
          riseTime: sunRiseTime,
          setText: "日落时间",
          setTime: sunSetTime,
          text: `${sunOffsetDate.getUTCHours()}小时${sunOffsetDate.getUTCMinutes()}`,
          percentage: inBoundary((currentTime - Sun["EpochRise"]) / (Sun["EpochSet"] - Sun["EpochRise"]))
        },
        {
          color: "#C5BBAD",
          riseText: "月出时间",
          riseTime: moonRiseTime,
          setText: "月落时间",
          setTime: moonSetTime,
          text: `${moonOffsetDate.getUTCHours()}小时${moonOffsetDate.getUTCMinutes()}`,
          percentage: inBoundary((currentTime - Moon["EpochRise"]) / (Moon["EpochSet"] - Moon["EpochRise"]))
        }
      ],
    };
    let AIRData = {};
    if (this.todayAir !== null) {
      const {Index, ParticulateMatter2_5, ParticulateMatter10, NitrogenDioxide, SulfurDioxide, Ozone} = this.todayAir;
      const [AQI, PM2_5, PM10, NO2, S02, O3] = [
        this.AIR_COLOR_ENUM[[50, 100, 150, 200, 300, 500, Number.MAX_VALUE].findIndex(i => Index <= i)],
        this.AIR_COLOR_ENUM[[35, 75, 115, 150, 250, 500, Number.MAX_VALUE].findIndex(i => ParticulateMatter2_5 <= i)],
        this.AIR_COLOR_ENUM[[50, 150, 250, 350, 420, 600, Number.MAX_VALUE].findIndex(i => ParticulateMatter10 <= i)],
        this.AIR_COLOR_ENUM[[100, 200, 700, 1200, 2340, 3480, Number.MAX_VALUE].findIndex(i => NitrogenDioxide <= i)],
        this.AIR_COLOR_ENUM[[150, 500, 650, 800, 1600, 2620, Number.MAX_VALUE].findIndex(i => SulfurDioxide <= i)],
        this.AIR_COLOR_ENUM[[160, 200, 300, 400, 800, 1200, Number.MAX_VALUE].findIndex(i => Ozone <= i)],
      ]
      AIRData = {
        AQI: AQI,
        AQIIndex: Index,
        AQIOtherDetailList: [
          {name: "PM2.5", index: ParticulateMatter2_5, AQIOther: PM2_5},
          {name: "PM10", index: ParticulateMatter10, AQIOther: PM10},
          {name: "NO2", index: NitrogenDioxide, AQIOther: NO2},
          {name: "S02", index: SulfurDioxide, AQIOther: S02},
          {name: "O3", index: Ozone, AQIOther: O3},
        ]
      };
    }
    const html = render({...sunAndMoonData, ...AIRData, isShowAIR: this.todayAir});
    this.moreDetailEl.html(html);
  }
}
