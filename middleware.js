const Log = require('./src/utils/Log')

module.exports = {
  /**
  * 往request对象上注入logid和__debug__
  * __logid__ 打log时统一添加，这样就不会由于异步打的log的无序性而不好看log
  * __debug__ 控制拿meta数据时的timetopublich范围
  */
  inject (req, res, next) {
    const { url } = req
    // const UA = req.headers['user-agent']
    /**
     * __debug__开关说明：
     * 用来控制timetopublish不再规定范围内的文章的渲染，包括正文页、专刊页。若为true，则不管范围，只要有值
     * 就渲染；若为false，则只渲染timetopublish在规定范围内的文章。
     * 注：专题没有timetopublish（数据库中的timetopublish为0），所以这个开关对其没有任何影响
     *
     * 同时，该开关属性也控制app内原生渲染数据接口若为true，则不管范围，只要有值
     * 就出数据；若为false，则只出timetopublish在规定范围内的文章数据。
     *
     * 原来这个开关是想控制所有的与timetopublish有关的接口和渲染器的，但是大叔说不能这么做，因为我们有些文章
     * 虽然不在规定的timetopublish范围内，也会出现在app的meta流中，同时也能渲染（所以，该开关属性我们硬编码为true），但是，tag页、author页、rss页等
     * 文章聚合类的页面，则不出现未在规定的timetopublish范围内的文章，这些策略导致不能用这个开关属性一刀切。
     * 我们只用这个开关属性进行正文页、专刊页、meta接口的控制，tag页、author页、rss页等
     * 文章聚合类的页面关于timetopublish的控制在他们的渲染器或service内控制
     *
     * 展现策略：
     *  在作者页、tag页、rss页timetopublish不再规定范围内的文章不展示
     *  但是，单篇文章不管是不是在规定范围内统一展示
     */
    req.__debug__ = true
    // if (/debug/i.test(url)) {
    //   req.__debug__ = true
    // } else if (/diaox2_(iOS|Android) +gray +Version/i.test(UA)) { // 如果是灰度版，则也是debug模式
    //   // Mozilla/5.0 (iPhone; CPU iPhone OS 10_3_2 like Mac OS X) AppleWebKit/603.2.4 (KHTML, like Gecko) Mobile/14F89 diaox2_iOS Version 3.8.2
    //   req.__debug__ = true
    // }
    req.__logid__ = `${url}` + Date.now() + Math.round(Math.random() * 1000)
    next()
  },
  allowCors (req, res, next) {
    // 只有OPTIONS请求，才加上跨域heander，其他请求不处理
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    // 如果前端fetch或ajax带cookie的话，必须设置 credentials 头为true
    // res.header('Access-Control-Allow-Credentials', true)
    res.header(
      'Access-Control-Allow-Headers',
      'Content-Type,Content-Length,Authorization,X-Request-With'
    )
    if (req.method === 'OPTIONS') {
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
        console.log(e)
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
