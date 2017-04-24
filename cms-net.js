'use strict'
const express = require('express')
const app = express()
const router = express.Router()
const compression = require('compression')()
const config = require('./package').config
const API = require('./config/api')
// const ServiceFactory = require('./service/ServiceFactory')
const _ = require('lodash')
// const cookieParser = require('cookie-parser')
const server_timestamp = _.now()
const Log = require('./src/utils/Log')
const varLogger = Log.getLogger('cms_var')
const runLogger = Log.getLogger('cms_run')
/**
  200 OK - [GET]：服务器成功返回用户请求的数据，该操作是幂等的（Idempotent）。
  201 CREATED - [POST/PUT/PATCH]：用户新建或修改数据成功。
  202 Accepted - [*]：表示一个请求已经进入后台排队（异步任务）
  204 NO CONTENT - [DELETE]：用户删除数据成功。
  400 INVALID REQUEST - [POST/PUT/PATCH]：用户发出的请求有错误，服务器没有进行新建或修改数据的操作，该操作是幂等的。
  401 Unauthorized - [*]：表示用户没有权限（令牌、用户名、密码错误）。
  403 Forbidden - [*] 表示用户得到授权（与401错误相对），但是访问是被禁止的。
  404 NOT FOUND - [*]：用户发出的请求针对的是不存在的记录，服务器没有进行操作，该操作是幂等的。
  406 Not Acceptable - [GET]：用户请求的格式不可得（比如用户请求JSON格式，但是只有XML格式）。
  410 Gone -[GET]：用户请求的资源被永久删除，且不会再得到的。
  422 Unprocesable entity - [POST/PUT/PATCH] 当创建一个对象时，发生一个验证错误。
  500 INTERNAL SERVER ERROR - [*]：服务器发生错误，用户将无法判断发出的请求是否成功。
 */
app.use(Log.getLog4js().connectLogger(Log.getLogger('cms_http'), {format: ':method :url'}))
// 启动压缩 -- 系统级中间件
app.use(compression)
// 处理options请求。设置response对象的可允许跨域的header信息
app.use(allowCors)
// 解析request对象中的body数据。处理好之后放到request对象上的body属性上供后续使用。
app.use(bodyParse)
// 把路由挂载至应用 不以根目录开始，以根目录下的 cms 目录作为路由中间件的开始匹配位置
app.use(`/${config.root}`, router)
console.log(__dirname)
app.use(express.static(__dirname + '/static'))
// 指定模板引擎为ejs
app.set("view engine", 'ejs')
// 指定模板位置
app.set('views', __dirname + '/src/views')
// 错误处理中间件
app.use(function(err, req, res, next) {
  runLogger.error(err)
  // 服务端错误
  return res.json({status: 500, server_timestamp: server_timestamp, message: `后端报错：${err.message}`})
})

/**
 * 有可能返回错误信息，但是数据库却更新成功了
 */
// 路由级中间件
router.use(bodyJSON)
router.get('/', (req, res) => {
  res.render('show.ejs', {
    body: `
      <p>大名鼎鼎的美白丸，吐槽用了没效果</p>
      <p>图</p>
      <p>景甜用的眼霜，洁面</p>
      <p>品牌介绍====</p>
      <p>SPF50，PA++++。乳液+防晒+隔离三合一，集防晒、抗老、保湿、美白多功能于一身</p>
      <p>1克20块钱</p>
      <p>质地水润，延展性好，滋润不泛白，清爽不粘腻</p>
      <p>图</p>
      <p>香味淡雅，闻起来hen高级！（可能是RMB的味道……）留香非常持久，简直可以作为固体香膏使用。</p>
    `
  })
})
// router.all(/(\w+)/i, requestHandler)
// 请求数据parse
function bodyJSON(req, res, next) {
  const method = req.method
  if (['POST', 'PUT'].indexOf(method) !== -1) {
    try {
      // 如果 req.body 为 空字符串或裸字符串，则parse会出异常
      req.body = JSON.parse(req.body)
    } catch (e) {
      req.body = null
    }
  } else if (['GET', 'DELETE'].indexOf(method) !== -1) {
    console.log('cms 210:', req.query);
    req.body = req.query
  }
  next() // 没有这一行，所有接口都会hang住
}

// 处理request请求数据
function bodyParse(req, res, next) {
  let data = ''
  // 取出请求数据
  req.on('data', chunk => data += chunk) // eslint-disable-line
  req.on('end', () => {
    // 把请求数据放到request对象上的body属性中
    // GET DELETE body为一个空行
    req.body = data
    if (data && req.body) {
      console.log('cms 228:', req.body)
      varLogger.info(`[parseBody function] the data is ${req.body}`)
    }
    next()
  })
}

function allowCors(req, res, next) {
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
}

app.listen(config.port)
