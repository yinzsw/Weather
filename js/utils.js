/**
 * 防抖
 * */
export function debounce(func, delay, immediate = false) {
  let timer = null, imm = immediate, result;
  let debounceFn = function (...args) {
    timer && clearTimeout(timer);
    let fn = () => [result, imm] = [func.apply(this, args), immediate && !imm];
    imm ? fn() : (timer = setTimeout(fn, delay));
    return result;
  }
  debounceFn.stop = function () {
    clearTimeout(timer) || (timer = null);
  }
  return debounceFn;
}

/**
 * 节流
 * */
export function throttle(func, delay) {
  let flag = true, result;
  return function (...args) {
    if (flag) setTimeout(() => [result, flag] = [func.apply(this, args), true], delay);
    flag = false;
    return result;
  }
}

/**
 * 格式化日期
 * */
export function dateFormat(date = new Date(), fmt = "yyyy-MM-dd hh:mm:ss") {
  const week = ["日", "一", "二", "三", "四", "五", "六"];
  const o = {
    'M+': date.getMonth() + 1,
    'd+': date.getDate(),
    'h+': date.getHours(),
    'm+': date.getMinutes(),
    's+': date.getSeconds(),
    "q+": Math.floor((date.getMonth() + 3) / 3),
    "E": week[date.getDay()],
    "S": date.getMilliseconds(),
  };
  if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
  return Object.keys(o).reduce((pre, cur) => new RegExp(`(${cur})`).test(fmt)
      ? pre.replace(RegExp.$1, (RegExp.$1.length === 1) ? o[cur] : `00${o[cur]}`.substr(`${o[cur]}`.length))
      : pre, fmt);
}

/**
 * 得到当前的位置信息
 * */
export function getPosition() {
  return new Promise(resolve => navigator.geolocation.getCurrentPosition(({coords}) => resolve(coords), ({message}) => alert(message)));
}

/**
 * 判断是否为移动端
 * */
export function isMobile() {
  let userAgent = navigator.userAgent;
  let agents = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"];
  return agents.some(item => userAgent.includes(item));
}

/**
 * 数组对象去重[o,o,o,...]
 * */
export function arrayObjectSet(array = [], key = "") {
  let map = new Map();
  array.forEach(item => map.has(item[key]) || map.set(item[key], item));
  return [...map.values()];
}