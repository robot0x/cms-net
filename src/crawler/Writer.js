// const Table = require('../db/Table')
// const table = new Table('article_meta', ['aid', 'content'])
// const fs = require('fs')
const Log = require('../utils/Log')
// const Promise = require('bluebird')
const DB = require('../db/DB')

class Writer {
  async write (content, id) {
    // const { markdown, meta, images } = content
    const { markdown } = content
    // const { id } = meta
    // const batch = []
    // batch.push(
    // 增量更新
    try {
      await DB.exec(
        `
      INSERT INTO diaodiao_article_content set aid=${id}, content=${DB.escape(markdown)}
      ON DUPLICATE KEY UPDATE content = ${DB.escape(markdown)}
      `
      )
      console.log(`ID为${id}的文章入库成功 ....`)
    } catch (error) {
      console.log(error)
      Log.exception(`id为${id}的文章写入article_content数据库出错，出错信息：`, err.message)
    }
  }
}

module.exports = Writer
