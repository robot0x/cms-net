module.exports = {

  allowCors (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*')
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
    // 如果前端fetch或ajax带cookie的话，必须设置 credentials 头为true
    // res.header('Access-Control-Allow-Credentials', true)
    res.header('Access-Control-Allow-Headers', 'Content-Type,Content-Length,Authorization,X-Request-With')
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
    req.on('data', chunk => data += chunk) // eslint-disable-line
    req.on('end', () => {
      // 把请求数据放到request对象上的body属性中
      // GET DELETE body为一个空行
      req.body = data
      // if (data && req.body) {
      //   // console.log('cms 228:', req.body)
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
        // req.body = null
      }
    } else if (['GET', 'DELETE'].indexOf(method) !== -1) {
      // console.log('cms 210:', req.query);
      req.body = req.query
    }
    next() // 没有这一行，所有接口都会hang住
  }


}
