/**
 * Meta信息包括：
 *   1. article_meta内所有的字段
 *   2. author信息
 *   3. 图片信息，包括：cover/coverex/swipe/banner图
 */
const AuthorTable = require('../db/AuthorTable')
const MetaTable = require('../db/MetaTable')
const Utils = require('../utils/Utils')
const Log = require('../utils/Log')
const MetaService = require('./MetaService')

class AuthorService {

  constructor(source) {
    this.metaTable = new MetaTable
    this.authorTable = new AuthorTable
    this.metaService = new MetaService
    this.setSource(source)
  }

  setSource(source) {
    this.source = source
  }

  // 渲染数据接口
  async getRenderData() {
    const {
      authorTable,
      metaTable,
      metaService,
      source
    } = this
    try {
      // let source = '+0'
      let author = await authorTable.getBySource(source)
      let aids = await metaTable.getAidsBySource(source)
      let defaultSource = '有调机器人'
      if (!author || !Utils.isValidArray(aids)) {
        author = await authorTable.getBySource(defaultSource)
        aids = await metaTable.getAidsBySource(defaultSource)
      }
      // 如果aids的长度为1，则返回的是对象而不是对象数组形式，需要处理一下
      let metas = await metaService.getRawMetas(aids, false, true)
      if(metas && !Utils.isValidArray(metas)) {
        metas = [metas]
      }
      console.log('author:', author)
      console.log('aids:', aids)
      console.log('metas:', metas)
      if(metas) {
        metas.sort((m1, m2) => m2.timetopublish - m1.timetopublish)
      }
      author.pic_uri = Utils.addUrlPrefix(author.pic_uri)
      return {
        author,
        metas
      }
    } catch (e) {
      Log.exception(e)
      return null
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
