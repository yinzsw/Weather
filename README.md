# Weather
Art-Template4 Bootstrap5 ECharts5 练习项目 天气预报响应式Web项目

### 部分界面
<div style="display: grid; grid-template-columns:auto auto;">
<img src="https://raw.githubusercontent.com/yinzsw/Weather/main/pic/pc01.png" width="40%" title="pc端示例图1">
<img src="https://raw.githubusercontent.com/yinzsw/Weather/main/pic/pc02.png" width="40%" title="pc端示例图2">
<img src="https://raw.githubusercontent.com/yinzsw/Weather/main/pic/m01.png" width="40%" title="移动端示例图1">
<img src="https://raw.githubusercontent.com/yinzsw/Weather/main/pic/m02.png" width="40%" title="移动端示例图2">
</div>

### 服务器代理配置(本地测试环境)

+ Nginx
``` Nginx
location /api/v1 {
  add_header "Access-Control-Allow-Origin"  *;
  proxy_pass https://api.accuweather.com/;
}

location /api/v2 {
  add_header "Access-Control-Allow-Origin"  *;
  proxy_pass https://standard.rhinoxlab.com/;
}
```
+ Apache(麻烦, 建议用Nginx)
