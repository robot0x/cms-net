const Table = require('./Table')
const Utils = require('../utils/Utils')

class BuyinfoTable extends Table {
  constructor () {
    // super('article_content', ['aid', 'content'], null, null)
    super('diaodiao_buyinfo', ['buy_id', 'mart', 'link', 'price', 'intro', 'link_pc'], null, null)
  }
}

// const buyinfoTable = new BuyinfoTable()
// buyinfoTable.getByAid(2112).then(content => {
//   console.log(content)
// })

module.exports = BuyinfoTable
