const ServiceMonitor = require('../src/index')

const serviceMonitor = new ServiceMonitor({
  interval: 5000, // 循环间隔，单位秒，默认 600（10分钟）
  // 邮件配置
  // 可视化入口、网页默认端口
  port: 8800,
})

// 测试接口, reqOptions，expectResOptions 返回的数据需要符合该条件
serviceMonitor.addApi(
  {
    url: 'https://api.zuo11.com/ibd/fooddaily/info',
    method: 'GET',
    payloadType: '', // 'serialize'、'json'
    // headers: {}
    // query: {}, // 未实现
    // payload: {},
  },
  { code: 200, msg: '成功', 'data.auditMark': 0 }
  // { code: 200, msg: '成功' }
  // { code: 200 }
)
serviceMonitor.addApi(
  { url: 'http://127.0.0.1:8000/user' },
  { a: 12 }
  // , { a: 1 }
)
serviceMonitor.addApi(
  { url: 'http://127.0.0.1:8000/user', method: 'POST', payload: { user: 'xxx' } },
  { code: 200, 'data.b': 1 }
)

// 测试网站是否可访问 url, 正常页面打开后，正常返回的 html 文本应该包含的内容
// curl -v xx 中应该包含的内容
serviceMonitor.addPage('http://www.zuo11.com', '<title>左小白的技术日常</title>')
serviceMonitor.addPage('http://fe.zuo11.com', '<title>首页 | 左小白的前端笔记</title>')
serviceMonitor.addPage('https://fe.zuo11.com', '<title>首页 | 左小白的前端笔记</title>')
serviceMonitor.addPage('https://kkk.zuo11.com', 'xxxx')

// 开始监听测试，如果发现错误发送邮件
serviceMonitor.monitor()
