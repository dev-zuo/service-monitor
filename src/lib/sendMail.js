const nodemailer = require('nodemailer')

function sendEmail(options) {
  return new Promise((resolve, rejected) => {
    // create reusable transport method (opens pool of SMTP connections)
    const smtpTransport = nodemailer.createTransport({
      host: 'smtp.qq.com', // qq smtp服务器地址, 如果是其他邮箱需要修改为对应的服务器
      secureConnection: false, // 是否使用安全连接，对https协议的
      port: 465, // qq邮件服务所占用的端口
      auth: {
        user: options.baseMail, // xxx@qq.com 开启SMTP的邮箱，有用发送邮件
        pass: options.baseAuthCode, // qq POP3/SMTP授权码，如果是gmail，直接填密码
      },
    })

    // setup e-mail data with unicode symbols
    const mailOption = {
      from: options.from, // sender address
      to: options.to, // list of receivers
      subject: options.title, // Subject line
      // text: `xxxxx`, // plaintext body
      // html body 会覆盖 text 内容
      html: options.mailHtml,
    }

    // send mail with defined transport object
    smtpTransport.sendMail(mailOption, (error) => {
      if (error) {
        console.log('邮件发送失败', error.message)
        rejected(error)
      } else {
        // 发送成功
        console.log('邮件发送成功')
        resolve('发送成功')
      }
      // if you don't want to use this transport object anymore, uncomment following line
      smtpTransport.close() // shut down the connection pool, no more messages
    })
  })
}

module.exports = sendEmail
