'use strict'
const express = require('express')
const router = require('./router')
const middleware = require('./middleware')
const config = require('./package').config
const Log = require('./src/utils/Log')
const app = express()
app.use(Log.getLog4js().connectLogger(Log.getHttpLogger(), {
  level: 'auto', // https://github.com/nomiddlename/log4js-node/wiki/Connect-Logger
  format:':remote-addr - ":method :url HTTP/:http-version" :status:referrer ":user-agent" :response-time ms',// http://www.senchalabs.org/connect/logger.htm
  nolog: /\.(gif|jpe?g|png|css|js)$/i // 不打印静态资源
}))
// 启动压缩 -- 系统级中间件
app.use(require('compression')())
// 处理options请求。设置response对象的可允许跨域的header信息
app.use(middleware.allowCors)
// 解析request对象中的body数据。处理好之后放到request对象上的body属性上供后续使用。
app.use(middleware.bodyParse)
// bodyjson中间件必须在挂载router之前，router才能使用
app.use(middleware.bodyJSON)
// 把路由挂载至应用 不以根目录开始，以根目录下的 cms 目录作为路由中间件的开始匹配位置
app.use(`/${config.root}`, router)
app.use((err, req, res, next)=>{run.error(err);return res.json({status:500,server_timestamp:Date.now(),message:err.toString()})})
app.use('/tool', express.static(`${__dirname}/src/render/static/tool`))
// router.use(middleware.bodyJSON)
app.listen(config.port)
