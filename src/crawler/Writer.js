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
      let insertContentResult = await DB.exec(
        `
      INSERT INTO diaodiao_article_content set aid=${id}, content=${DB.escape(markdown)}
      ON DUPLICATE KEY UPDATE content = ${DB.escape(markdown)}
      `
      )
      console.log(`[STEP3] ID为 ${id} 插入content表成功，影响${insertContentResult.affectedRows}行 ...`)
    } catch (error) {
      console.log(error)
      console.log(`ID为 ${id} 插入content表失败：`, error)
      Log.exception(`ID为 ${id} 插入content表失败：`, error)
    }
  }
}

module.exports = Writer
