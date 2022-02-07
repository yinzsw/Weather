import {AppInit, Search, SundryBar, WeatherInfo} from "./class.js";
import {isMobile} from "./utils.js";

$(function () {
  //init JQuery DOM And Base Data
  const searchEl = $("#search");
  const searchResultEl = $(".search-result");
  const sundryEl = $("#sundry-bar");
  const warningEl = $("#warning");
  const todayWeatherEl = $("#today-weather");
  const forecasts24hEl = $("#forecasts24h");

  //init Component Object
  new AppInit();
  const search = new Search(searchEl, searchResultEl);
  const sundryBar = new SundryBar(sundryEl);
  const weatherInfo = new WeatherInfo();

  sundryBar.render();
  weatherInfo.loadWeatherInfo();

  //搜索框操作
  searchEl.on("blur focus input", e => {
    if (e.type === "blur") return search.hide();
    search.renderTplDeb(e.type);
    search.show();
  });

  //加载当前位置信息
  searchResultEl.on("mousedown", ".location", async () => {
    const o = await search.getCurrentPositionData();
    search.saveInfoToLocal(o);
    sundryBar.render().then();
    warningEl.slideUp(0);
    weatherInfo.loadWeatherInfo().then();
  });

  //搜索信息按下事件
  searchResultEl.on("mousedown", ".search-result-item,.recently-search-item a", e => {
    search.saveInfoToLocal(JSON.parse(e.currentTarget.dataset.info));
    sundryBar.render().then();
    warningEl.slideUp(0);
    weatherInfo.loadWeatherInfo().then();
  });

  //历史信息删除按下事件
  searchResultEl.on("mousedown", ".recently-search-item img", e => search.deleteInfoInLocal($(e.currentTarget).parent().index()));

  //切换温度单位
  sundryEl.on("click", ".switch-unit div", e => {
    const targetEl = e.currentTarget;
    const isActive = targetEl.classList.contains("unit-active");
    const unitEl = $("span[data-unitc]");
    if (targetEl.dataset.unit === "C" && !isActive) unitEl.each((index, dom) => dom.innerText = dom.dataset.unitc);
    else if (targetEl.dataset.unit === "F" && !isActive) unitEl.each((index, dom) => dom.innerText = (+dom.dataset.unitc * 1.8 + 32).toFixed(1));
    sundryBar.switchUnit($(targetEl));
    weatherInfo.showECharsIn10dTpl(targetEl.dataset.unit);
  });

  //警告信息展示
  todayWeatherEl.on("click", ".weather-warning", () => {
    const display = warningEl.css("display");
    if (isMobile()) return display === "flex" ? warningEl.slideUp(350) : warningEl.slideDown(500).css("display", "flex");
    display === "flex" ? warningEl.fadeOut(200) : warningEl.fadeIn(800).css("display", "flex");
  });

  //展开天气信息24h
  isMobile() || forecasts24hEl.on("click", ".nav-info", e => {
    const target = $(e.currentTarget);
    target.toggleClass("active");
    target.parent().siblings().children(".nav-info").removeClass("active");
  });

  //滚动窗口按钮
  forecasts24hEl.on("click", ".btn-box", e => {
    const forecasts24hNavEl = forecasts24hEl.find(".forecasts24h-item-nav");
    const scrollLeft = forecasts24hNavEl.scrollLeft();
    let offset = forecasts24hNavEl.width() * .85;
    if (e.currentTarget.dataset.btn === "-") offset = -offset;
    offset += scrollLeft
    forecasts24hNavEl.animate({scrollLeft: offset}, 1000);
  });
});