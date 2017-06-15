// const Table = require('../db/Table')
// const table = new Table('article_meta', ['aid', 'content'])
// const fs = require('fs')
const Log = require('../utils/Log')
// const Promise = require('bluebird')
const DB = require('../db/DB')

class Writer {
  async write (content, id) {
    // const { markdown, meta, images } = content
    let { markdown } = content
    if (markdown) {
      markdown = markdown.replace(/\*{4}/g, '')
    }
    // const { id } = meta
    // const batch = []
    // batch.push(
    // 增量更新
    try {
      /**
       * 这些文章含有连续两个strong的问题，比如 **一****二****三**，就会导致解析出现问题，我们把
       * 27,227,394,458,577,791,808,990,1210,1247,1261,1273,1319,1371,1405,1407,1447,
       * 1673,1721,1741,1767,1796,1828,1831,1866,1908,1929,1949,2240,2511,2521,2539,
       * 2540,2568,2831,2985,3946,4149,4164,4427,4482,4540,4745,4860,4936,5163,5205,
       * 5210,5266,5401,5639,5851,5879,5894,6336,6360,6371,6560,6624,6632,6834,6985,
       * 7002,7191,7224,7264,7272,7285,7321,7323,7409,7693,7781,7886,8018,8303,8315,
       * 8341,8524,8575,8632,8635,8711,8801,8923,9179,9187,9501,9625,9731,9824,
       * 9931,9992,10043,10099,10197
       */
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
