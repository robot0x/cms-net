const Table = require('./Table')
const Utils = require('../utils/Utils')
const defaultAuthor = require('../../config/app').defaultAuthor
class AuthorTable extends Table {
  constructor () {
    super(
      'diaodiao_author',
      [
        'source',
        'title',
        'intro',
        'type',
        'pic_uri',
        'link',
        'naming',
        'value',
        'brief'
      ],
      null,
      null
    )
  }
  // article_content的主键为aid
  async getBySource (source) {
    source = source || defaultAuthor
    let data = await super.getByCond({ source })
    console.log('source:', source)
    if (!Utils.isValidArray(data)) {
      console.log('data不存在 ....')
      data = await super.getByCond({ source: defaultAuthor })
    }
    console.log('data:', data)
    return Utils.getFirst(data)
  }
  getByTitle (title) {
    return super.getByCond({ title })
  }
}

// const authorTable = new AuthorTable
// authorTable.getById(1).then(data => console.log(data))
// authorTable.getBySource('50已到').then(data => console.log(data))

module.exports = AuthorTable
