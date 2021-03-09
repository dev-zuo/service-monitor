# service-monitor

Web Service monitor by Node.js, used to check the accessibility of web pages and APIs, and send email notifications.

基于 Node.js 的 Web 服务监控系统，用于检测网页、接口 API 的可访问性，发送邮件通知。视频介绍：[bilibili](https://www.bilibili.com/video/BV1LK4y1J7gM/)

npm package

[![NPM](https://nodei.co/npm/service-monitor.png)](https://npmjs.org/package/service-monitor)

## 快速上手
安装
```bash
npm install service-monitor --save
```
使用
```js
const ServiceMonitor = require('service-monitor')
const serviceMonitor = new ServiceMonitor({
  scheduleStr: '1 * * * * *', // 每分钟第一秒执行任务
  mailOption: {} // 可选，用于发送测试报告邮件用
  port: 8888, // 网页默认端口
  path: '/monitor', // 网页默认路径
})

// 添加需要测试的接口、网页
serviceMonitor.addApi( { url: 'http://127.0.0.1:8000/user' }, { a: 1 })
serviceMonitor.addPage('http://www.zuo11.com', '<title>左小白的技术日常</title>')

// 开始监听
serviceMonitor.monitor()
```
运行后，访问 http://127.0.0.1:8888/monitor 可以直接实时测试、显示结果

## 完整功能实例
```js
const ServiceMonitor = require('service-monitor')

const serviceMonitor = new ServiceMonitor({
  // 定时任务时间参数，与 node-monitor 时间参数一致
  scheduleStr: '1 * * * * *', // 测试用，每分钟第一秒执行任务
  // scheduleStr: '0 0 7,14,21 * * *', // 每天 7 点、14点、21点执行

  // 邮件配置（用于发送测试报告邮件）
  mailOption: {
    baseMail: 'xxx@qq.com', // 用于发送邮件的基础邮箱
    baseAuthCode: 'xxxx', // 由于发送邮件的 qq POP3/SMTP 授权码，如果是 gmail，直接填密码
    from: 'guoqzuo <i@zuoguoqing.com>', // 发件人
    to: 'i@zuoguoqing.com,guoqzuo@gmail.com', // 收件人
    title: 'Service monitor 报告', // 自定义邮件标题前缀
  },

  // 网页实时测试、可视相关配置
  // http://127.0.0.1:8888/monitor 可以直接实时测试、显示结果
  port: 8888, // 网页默认端口
  path: '/monitor', // 网页默认路径
})

// 添加需要测试的接口, 返回的数据需要符合该条件
serviceMonitor.addApi(
  {
    url: 'https://api.zuo11.com/ibd/fooddaily/info',
    method: 'GET',
    payloadType: '', // 'serialize'、'json'
    // headers: {}
    // payload: {}, // post 发送数据
  },
  { code: 200, msg: '成功', 'data.auditMark': 0 }
  // { code: 200, msg: '成功' }
  // { code: 200 }
)
serviceMonitor.addApi(
  { url: 'http://127.0.0.1:8000/user' },
  // { a: 12 }
  { a: 1 }
)

// 添加需要测试的网站
// 测试网站是否可访问 url, 正常页面打开后，正常返回的 html 文本应该包含的内容
// curl -v xx 中应该包含的内容
serviceMonitor.addPage('http://www.zuo11.com', '<title>左小白的技术日常</title>')
// http
serviceMonitor.addPage('http://fe.zuo11.com', '<title>首页 | 左小白的前端笔记</title>')
// https
serviceMonitor.addPage('https://fe.zuo11.com', '<title>首页 | 左小白的前端笔记</title>')
// serviceMonitor.addPage('https://kkk.zuo11.com', 'xxxx')

// 开始执行监听任务，开启 http 服务，可以通过 http://127.0.0.1:[port][path] 手动测试并查看结果
serviceMonitor.monitor()
```
## 常见问题
### qq POP3/SMTP授权码错误，会出现如下错误

sendMail fail Invalid login: 535 Login Fail. Please enter your authorization code to login. More information in http://service.mail.qq.com/cgi-bin/help?subtype=1&&id=28&&no=1001256

注意检查授权码是否正确

## 核心思路
测试方法
- 测试接口，发送 http 请求，比对结果
- 测试网页是否可访问，发送 GET 请求，比对返回文本是否匹配

结果收集上报
- 为了方便查看结果，由于需要可以把所有测试结果上报（发邮件）或显示在页面上
- 由于请求都是异步的，需要都使用 Promise 封装。待全部测试完成后，resolve 对应的结果。如果超时，reject 并返回部分结果。

## 实现顺序
- [x] 实现测试网页逻辑
- [x] 实现测试 API 逻辑
- [x] 实现结果收集
- [x] 将结果发送邮件
- [x] 定时任务
- [x] 打开网页，实时手动检测
