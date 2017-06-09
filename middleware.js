const Log = require('./src/utils/Log')

module.exports = {
  /**
  * 往request对象上注入logid和__debug__
  * __logid__ 打log时统一添加，这样就不会由于异步打的log的无序性而不好看log
  * __debug__ 控制拿meta数据时的timetopublich范围
  */
  inject (req, res, next) {
    const { url } = req
    // 默认
    req.__debug__ = false
    if (/debug/i.test(url)) {
      req.__debug__ = true
    }
    req.__logid__ = `${url}` + Date.now() + Math.round(Math.random() * 1000)
    next()
  },
  allowCors (req, res, next) {
    // 只有OPTIONS请求，才加上跨域heander，其他请求不处理
    if (req.method === 'OPTIONS') {
      res.header('Access-Control-Allow-Origin', '*')
      res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
      // 如果前端fetch或ajax带cookie的话，必须设置 credentials 头为true
      // res.header('Access-Control-Allow-Credentials', true)
      res.header(
        'Access-Control-Allow-Headers',
        'Content-Type,Content-Length,Authorization,X-Request-With'
      )
      res.sendStatus(200)
    } else {
      next()
    }
  },

  // 处理request请求数据
  bodyParse (req, res, next) {
    let data = ''
    // 取出请求数据
    req.on("data", chunk => data += chunk); // eslint-disable-line
    req.on('end', () => {
      // 把请求数据放到request对象上的body属性中
      // GET DELETE body为一个空行
      req.body = data
      // if (data && req.body) {
      //   varLogger.info(`[parseBody function] the data is ${req.body}`)
      // }
      next()
    })
  },

  // 请求数据parse
  bodyJSON (req, res, next) {
    const method = req.method
    if (['POST', 'PUT'].indexOf(method) !== -1) {
      try {
        // 如果 req.body 为 空字符串或裸字符串，则parse会出异常
        req.body = JSON.parse(req.body)
      } catch (e) {
        Log.exception(e)
        // req.body = null
      }
    } else if (['GET', 'DELETE'].indexOf(method) !== -1) {
      req.body = req.query
    }
    next() // 没有这一行，所有接口都会hang住
  },

  // 错误处理中间件
  errorHandler (err, req, res, next) {
    // 服务端错误
    return res.json({
      status: 500,
      server_timestamp: Date.now(),
      message: `后端报错：${err}`
    })
  },

  // http日志中间件
  log () {
    return Log.getLog4js().connectLogger(Log.getHttpLogger(), {
      level: 'auto', // https://github.com/nomiddlename/log4js-node/wiki/Connect-Logger
      // format: ':remote-addr - ":method :url HTTP/:http-version" :status:referrer ":user-agent" :response-time ms', // http://www.senchalabs.org/connect/logger.htm
      format: ':remote-addr - ":method :url HTTP/:http-version" :status ":user-agent" :response-time ms', // http://www.senchalabs.org/connect/logger.htm
      nolog: /\.(gif|jpe?g|png|css|js|ico)$/i // 不打印静态资源
    })
  }
}
