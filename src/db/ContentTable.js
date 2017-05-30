const Table = require('./Table')
const Utils = require('../utils/Utils')

class ContentTable extends Table {
  constructor () {
    // super('article_content', ['aid', 'content'], null, null)
    super('diaodiao_article_content', ['content'], null, null)
  }
  // article_content的主键为aid
  async getById (id) {
    const data = Utils.getFirst(await super.getByAid(id))
    let content = null
    if (data) {
      content = data.content
    }
    return content
  }

  /**
   * 根据文章id获取一条数据
   */
  async getByIds (ids) {
    let sql = `SELECT aid AS id, content FROM ${this.table} WHERE aid in (${ids.join(',')})`
    let data = await this.exec(sql)
    // console.log('sql:', sql)
    return data
  }
}

// const contentTable = new ContentTable()
// contentTable.getByIds([1, 2]).then(content => {
//   console.log(content)
// })

module.exports = ContentTable
