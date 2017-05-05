const Table = require('./Table')
/**
 * 2014-10-1之前的和今天以后的都不渲染
 */
class TagIndexTable extends Table {
  constructor () {
    super('diaodiao_article_tag_index', ['aid','tag1','tag2'], null, null)
  }
  // article_content的主键为aid
  async getByAId (id) {
    return await super.exec(`SELECT ${this.columnsStr} FROM ${this.table} WHERE aid = ${id} AND tag1 <> 'page_type'`)
  }

  async getByTag1 (tag1) {
    return await super.getByCond({ tag1 })
  }

  async getByTag2 (tag2) {
    return await super.getByCond({ tag2 })
  }

}
// var tit = new TagIndexTable()
// tit.getByAid(8090).then(data => {
//   console.log(data)
// })
//
module.exports = TagIndexTable
