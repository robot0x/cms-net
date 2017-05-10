const Table = require('./Table')
const Utils = require('../utils/Utils')

class ImageTable extends Table {
  constructor () {
    super('diaodiao_article_image', [
      'id',
      'aid',
      'url',
      'used',
      'type',
      'origin_filename',
      'extension_name',
      'size',
      'width',
      'height',
      'alt',
      'title',
      'create_time'
    ], null, null)
  }

  // 第1位-内容图(1)/第2位cover图(2)/第3位coverex图(4)/第4位thumb图(8)/第5位swipe图(16)/第6位banner图(32)
  async _getOnlyUrl (aid, type) {
    const images = await this.getSpecialImagesUrl(aid, type)
    let urls = null
    if (images) {
      urls = images.map(image => image.url)
    }
    return urls
  }

  async getCoverImagesUrl (aid) {
    return this._getOnlyUrl(aid, 2)
  }

  async getCoverexImagesUrl (aid) {
    return this._getOnlyUrl(aid, 4)
  }

  async getThumbImagesUrl (aid) {
    return this._getOnlyUrl(aid, 8)
  }

  getSpecialImagesUrl (aid, types, columns = ['url', 'type']) {
    let sql = ` SELECT ${columns.join(',')} FROM ${this.table} WHERE `
    if(Utils.isValidArray(aid)) {
       sql += ` aid in (${Utils.toShortId(aid).join(',')}) `
    } else {
      sql += ` aid = ${aid} `
    }
    if(Utils.isValidArray(types)) {
      sql += 'AND ('
      types.forEach((type, index) => {
        sql += ` type & ${type} = ${type} ${index === types.length - 1 ? '' : 'OR'} `
      })
      sql += ')'
    } else {
      sql += ` AND type & ${types} = ${types} `
    }
    return this.exec(sql)
    // console.log(sql)
    // let images = await this.exec(sql)
    // let urls = null
    // if (images) {
    //   urls = images.map(image => image.url)
    // }
    // return urls
  }
}

// const imageTable = new ImageTable()
// imageTable.getSpecialImagesUrl(1, [2, 4, 8]).then(data => {
//   console.log('[imageTable.getSpecialImagesUrl]:', data)
// })
// imageTable.getSpecialImagesUrl([1, 3, 4], [2, 4, 8]).then(data => {
//   console.log('[imageTable.getSpecialImagesUrl]:', data)
// })
// imageTable.getCoverImagesUrl(1).then(data => {
//   console.log(data)
// })
// imageTable.getCoverexImagesUrl(1).then(data => {
//   console.log(data)
// })
// imageTable.getThumbImagesUrl(1).then(data => {
//   console.log(data)
// })

module.exports = ImageTable
