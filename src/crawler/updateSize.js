const fs = require('fs')
const Table = require('../db/Table')
const table = new Table('article_meta', ['aid', 'content'])
const Log = require('../utils/Log')
const runLogger = Log.getLogger('cms_run')
// const Promise = require('bluebird')
const DB = require('../db/DB')
const db = new DB()

fs.readFile('./data/all_pics', 'utf8', (err, text) => {
  if (err) {
    console.log(err)
  } else {
    text.split(/\n/).forEach(content => {
      if (
        !/^\d+/.test(content) && !/content\.image\.alimmdn\.com/.test(content)
      ) {
        return
      }
      let [size, url] = content.split(/\s+/)
      table
        .exec(`UPDATE image set size=${size} where url=${db.escape(url)}`)
        .then(data => {
          console.log(`URL为 ${url} 的图片更新成功 ....`)
        })
        .catch(err => {
          console.log(err)
          runLogger.error(`URL为 ${url} 的图片更新image数据库出错，出错信息：`, err.message)
        })
    })
  }
})
