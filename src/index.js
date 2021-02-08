const http = require('http')
const https = require('https')
const querystring = require('querystring')
const log4js = require('log4js')
const schedule = require('node-schedule')
const sendMail = require('./lib/sendMail')

const logger = log4js.getLogger()
logger.level = 'debug'

class ServiceMonitor {
  constructor(options) {
    const { interval = 3000, port = 8800, mailOption, scheduleStr } = options
    this.interval = interval
    this.port = port
    this.mailOption = mailOption
    this.scheduleStr = scheduleStr
    this.apiList = []
    this.pageList = []
  }

  addApi(reqOptions, expectRes) {
    this.apiList.push({ reqOptions, expectRes })
  }

  addPage(url, expectContainsText) {
    this.pageList.push({ url, expectContainsText })
  }

  // 每日定时任务
  monitor() {
    if (this.pageList.length === 0 && this.apiList.length === 0) {
      console.log('没有需要测试的内容，请检查配置')
      return
    }

    // Job
    console.log('start monitor')
    schedule.scheduleJob(this.scheduleStr, async () => {
      try {
        const result = await this.startTestPromise()
        this.sendEmail(result)
      } catch (e) {
        console.log(e.message)
      }
    })
  }

  /**
   * 发送邮件
   * @param {*} result
   */
  async sendEmail(result) {
    const { pagePassList, pageFailList, apiPassList, apiFailList } = result
    // 处理结果，或发邮件
    const isPass = pageFailList.length === 0 && apiFailList.length === 0
    try {
      await sendMail({
        ...this.mailOption,
        title: `${this.mailOption.title} - ${isPass ? 'PASS' : 'FAIL'}`,
        mailHtml: `
          <div>测试结果：${
            isPass
              ? '<span style="color: green">全部通过</span>'
              : '<span style="color:red">发现异常</span>'
          }</div>
  
          <p>总测试项 ${this.pageList.length + this.apiList.length} 个，通过测试项 ${
          pagePassList.length + apiPassList.length
        } 个，异常测试项 ${pageFailList.length + apiFailList.length} 个</p>
        <div style="color: red">${pageFailList.length ? pageFailList.join('<br/>') : ''}</div>
        <div style="color: red">${apiFailList.length ? apiFailList.join('<br/>') : ''}</div>
        <div style="color: green">${pagePassList.length ? pagePassList.join('<br/>') : ''}</div>
        <div style="color: green"> ${apiPassList.length ? apiPassList.join('<br/>') : ''}</div>
        `,
      })
    } catch (e) {
      console.log(e.message)
    }
  }

  /**
   * 开始遍历测试服务
   * 结果收集策略：Promise.all
   */
  startTestPromise() {
    // 没有 resolve，等待所有结果完成即可，后期可能加一个超时报错处理，防止卡死
    return new Promise((resolve) => {
      console.log(`\nStart Test`)

      let testPageCount = 0
      let testAPICount = 0
      const pagePassList = []
      const pageFailList = []
      const apiPassList = []
      const apiFailList = []

      function getResult() {
        return {
          pagePassList,
          pageFailList,
          apiPassList,
          apiFailList,
        }
      }

      // Test page
      this.pageList.forEach(async (item) => {
        try {
          const successMsg = await this.testPagePromise(item)
          pagePassList.push(successMsg)
        } catch (e) {
          pageFailList.push(e.message)
        } finally {
          testPageCount += 1
          if (testPageCount === this.pageList.length) {
            // 网页 异步遍历测试完成
            // console.log('所有 page 测试结果', pageFailList, pagePassList)
            if (testAPICount === this.apiList.length) {
              // 所有测试完成
              resolve(getResult())
            }
          }
        }
      })

      // Test API
      this.apiList.forEach(async (item) => {
        try {
          const successMsg = await this.testApiPromise(item)
          apiPassList.push(successMsg)
        } catch (e) {
          apiFailList.push(e.message)
        } finally {
          testAPICount += 1
          if (testAPICount === this.apiList.length) {
            // 网页 异步遍历测试完成
            // console.log('所有 api 测试结果', apiFailList, apiPassList)
            if (testPageCount === this.pageList.length) {
              // 所有测试完成
              resolve(getResult())
            }
          }
        }
      })
    })
  }

  /**
   * 对页面/资源发起 GET 请求并比对，返回 Promise
   * 请求成功且文本匹配成功，reslove(成功信息)
   * 请求失败或文本不匹配，reject(错误信息)
   */
  testPagePromise(pageInfo) {
    const { url, expectContainsText } = pageInfo
    const httpObj = this.getHttpObj(url)
    return new Promise((reslove, reject) => {
      const logPreInfo = `${url}`
      const req = httpObj.get(url, (res) => {
        res.setEncoding('utf8')
        let rawData = ''
        res.on('data', (chunk) => {
          rawData += chunk
        })
        res.on('end', () => {
          const IS_OK = rawData.includes(expectContainsText)
          if (IS_OK) {
            const successMsg = `${logPreInfo} 访问正常`
            logger.info(successMsg)
            reslove(successMsg)
          } else {
            const failMsg = `${logPreInfo} 访问异常，与希望文本不匹配`
            logger.error(failMsg)
            reject(new Error(failMsg))
          }
        })
      })
      req.on('error', (e) => {
        const errMsg = `${logPreInfo} 访问异常, ${e.message}`
        logger.error(errMsg)
        reject(new Error(errMsg))
      })
    })
  }

  /**
   * 对接口发起请求并比对，返回 Promise
   */
  testApiPromise(apiInfo) {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', headers, payloadType = 'json', payload } = apiInfo.reqOptions
      const httpObj = this.getHttpObj(url)
      const preInfo = `${url}`
      const req = httpObj.request(
        url,
        {
          method,
          headers: {
            'Content-Type':
              payloadType === 'serialize'
                ? 'application/x-www-form-urlencoded'
                : 'application/json',
            ...headers,
          },
        },
        (res) => {
          res.setEncoding('utf8')
          let rawData = ''
          res.on('data', (chunk) => {
            rawData += chunk
          })
          res.on('end', () => {
            // console.log(rawData, typeof rawData)
            const IS_OK = ServiceMonitor.isExpected(apiInfo.expectRes, rawData)
            if (IS_OK) {
              const successMsg = `${preInfo} 接口正常`
              logger.info(successMsg)
              resolve(successMsg)
            } else {
              const failMsg = `${preInfo} 接口异常，与希望返回值不匹配：${rawData}`
              logger.error(failMsg)
              reject(new Error(failMsg))
            }
          })
        }
      )
      req.on('error', (e) => {
        const errMsg = `${preInfo} 接口异常, ${e.message}`
        logger.error(errMsg)
        reject(new Error(errMsg))
      })
      if (payload) {
        // 如果有请求数据
        req.write(
          payloadType === 'serialize' ? querystring.stringify(payload) : JSON.stringify(payload)
        )
      }
      req.end()
    })
  }

  /**
   * 根据 url 获取请求对象，http 或 https
   * @param {*} url
   */
  // eslint-disable-next-line class-methods-use-this
  getHttpObj(urlText) {
    return urlText.startsWith('https') ? https : http
  }

  /**
   * 判断接口返回的数据是否与期望的一致
   * @param {*} expectRes 接口希望返回值
   * @param {*} res 接口实际返回值
   */
  // eslint-disable-next-line consistent-return
  static isExpected(expectRes, res) {
    // console.log(res, expectRes)
    const expectResType = typeof expectRes
    if (!['object', 'string'].includes(expectResType)) {
      // console.log('===1')
      return false
    }

    // 如果是文本
    if (expectResType === 'string') {
      // console.log('===6')
      return res === expectRes
    }

    // 如果是对象
    if (expectResType === 'object') {
      const resObj = JSON.parse(res)
      const props = Object.keys(expectRes)
      if (props.length === 0) {
        // console.log('===2')
        return false
      }
      // { 'a': 1, 'c.b.k': '123', k: 'any' }
      for (let i = 0, len = props.length; i < len; i += 1) {
        const prop = props[i]
        if (prop.includes('.')) {
          const propArr = prop.split('.')
          let result = resObj
          for (let j = 0; j < propArr.length; j += 1) {
            if (!Object.prototype.hasOwnProperty.call(result, propArr[j])) {
              // console.log('===3')
              return false
            }
            result = result[propArr[j]]
            // console.log(result)
          }
          if (expectRes[prop] !== result) {
            // console.log('===4')
            return false
          }
        } else if (expectRes[prop] !== resObj[prop]) {
          // 不包含 . 的属性名
          // console.log(expectRes[prop], resObj[prop])
          // console.log('===5')
          return false
        }
      }
      return true
    }
  }
}

module.exports = ServiceMonitor
