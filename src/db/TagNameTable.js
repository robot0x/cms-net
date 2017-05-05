const Table = require('./Table')
const Utils = require('../utils/Utils')
/**
 * 2014-10-1之前的和今天以后的都不渲染
 */
class TagNameTable extends Table {
  constructor () {
    super('article_tag_name', ['tid','name','level', 'parent'], null, null)
  }
  // article_content的主键为aid
  async getByTid (tid) {
    return Utils.getFirst(await super.getByCond({ tid }))
  }

  // 根据一个tid，拿到父的tid和tagname
  async getParentTagByTid (tid, columns = ['tid', 'name']) {
    return Utils.getFirst(await this.exec(`
      SELECT ${columns.join(',')} FROM ${this.table} WHERE tid IN (SELECT parent FROM ${this.table} WHERE tid = ${tid})
    `))
  }

  getAll (columns = this.columns) {
    return this.exec(`SELECT ${columns.join(',')} FROM ${this.table}`)
  }
}

// const tnt = new TagNameTable
// tnt.getByTid(100000).then(data => console.log(data))


module.exports = TagNameTable
