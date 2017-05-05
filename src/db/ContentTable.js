const Table = require('./Table')
const Utils = require('../utils/Utils')

class ContentTable extends Table {
  constructor () {
    // super('article_content', ['aid', 'content'], null, null)
    super('article_content', ['content'], null, null)
  }
  // article_content的主键为aid
  async getById (id) {
    const data =  Utils.getFirst(await super.getByAid(id))
    let content = null
    if (data) {
      content = data.content
    }
    return content
  }
}

// const contentTable = new ContentTable()
// contentTable.getById(1).then(content => {
//   console.log(content)
// })

module.exports = ContentTable
