/**
 * Meta信息包括：
 *   1. article_meta内所有的字段
 *   2. author信息
 *   3. 图片信息，包括：cover/coverex/swipe/banner图
 */
const AuthorTable = require('../db/AuthorTable')
const MetaTable = require('../db/MetaTable')
const Utils = require('../utils/Utils')
const MetaService = require('./MetaService')

class AuthorService {

  constructor (source) {
    this.metaTable = new MetaTable
    this.authorTable = new AuthorTable
    this.metaService = new MetaService
    this.setSource(source)
  }

  setSource (source) {
    this.source = source
  }

  // 渲染数据接口
  async getRenderData () {
    const { authorTable, metaTable, metaService } = this
    try {
      let source = this.source
      // let source = '+0'
      let author = await authorTable.getBySource(source)
      let aids = await metaTable.getAidsBySource(source)
      console.log(author);
      // console.log(aids);
      let metas = await metaService.getRawMetas(aids, false, true)
      metas.sort((m1, m2) => m2.timetopublish - m1.timetopublish)
      author.pic_uri = Utils.addUrlPrefix(author.pic_uri)
      return { author, metas }
    } catch (e) {
      console.log(e)
      throw new Error(e)
    }
  }

}

// const service = new AuthorService('+0')
// service.getRenderData()
// .then(meta => {
//   console.log('178:', meta)
// })
// .catch(e => {
//   console.log(e)
// })



module.exports = AuthorService
