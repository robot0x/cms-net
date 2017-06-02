'use strict'
const express = require('express')
const router = require('./router')
const middleware = require('./middleware')
const timeout = require('connect-timeout')
const config = require('./package').config
const app = express()
// 设置20秒的超时时间，防止express执行一个长时间的认为不返回，hang住node主进程
app.use(timeout(20000))
// http日志中间件
app.use(middleware.log())
// GZIP中间件
app.use(require('compression')())
// 处理options请求。设置response对象的可允许跨域的header信息
app.use(middleware.allowCors)
// 解析request对象中的body数据。处理好之后放到request对象上的body属性上供后续使用。
app.use(middleware.bodyParse)
// bodyjson中间件必须在挂载router之前，router才能使用
app.use(middleware.bodyJSON)
// 把路由挂载至应用 不以根目录开始，以根目录下的 cms 目录作为路由中间件的开始匹配位置
app.use(`/${config.root}`, router)
// 错误处理中间件
app.use(middleware.errorHandler)
// 把一些静态页面交给express托管
app.use('/tool', express.static(`${__dirname}/src/render/static/tool`))
// router.use(middleware.bodyJSON)
app.listen(config.port)
