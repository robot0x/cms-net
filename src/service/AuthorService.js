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
  constructor (source) {
    this.metaTable = new MetaTable()
    this.authorTable = new AuthorTable()
    this.metaService = new MetaService()
    this.setSource(source)
  }

  setSource (source) {
    this.source = source
    return this
  }

  // 渲染数据接口
  /**
   * @param {any} [source=this.source] 
   * @param {boolean} [useTimetopublishInterval=true] 
   * @returns
   * @memberof AuthorService
   * 如果一篇文章的timetopublish不再允许的范围内，渲染器是可以渲染的，但是不要出现在作者页上
   */
  async getRenderData (source = this.source, useTimetopublishInterval = true) {
    const { authorTable, metaTable, metaService } = this
    try {
      let [author, aids] = await Promise.all([authorTable.getBySource(source), metaTable.getAidsBySource(source)])
      // 如果aids的长度为1，则返回的是对象而不是对象数组形式，需要处理一下
      let metas = await metaService.getRawMetas(aids, false, true)
      if (metas && !Utils.isValidArray(metas)) {
        metas = [metas]
      }
      if (metas) {
        // timetopublish不再规定范围内，不予显示。详见middleware.js关于__debug__的说明。
        let {startDate, endDate} = Utils.genStarAndEndDateForTimetopublish()
        metas = metas.filter(meta => {
          return meta.timetopublish >= startDate && meta.timetopublish <= endDate
        })
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
