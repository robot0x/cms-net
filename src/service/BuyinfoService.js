/**
 * Meta信息包括：
 *   1. article_meta内所有的字段
 *   2. author信息
 *   3. 图片信息，包括：cover/coverex/swipe/banner图
 */
const BuyinfoTable = require('../db/BuyinfoTable')
const MetaService = require('./MetaService')
const Utils = require('../utils/Utils')
const request = require('request')

class BuyinfoService {

  constructor (aid) {
    this.buyinfoTable = new BuyinfoTable
    this.metaService = new MetaService
    this.setAid(aid)
  }

  setAid (aid) {
    this.aid = aid
  }
  // 渲染数据接口
  async getRenderData (aid = this.aid) {
    try {
      // 根据规则拿购买链接，把meta表中的购买链接作为第二个参数，这样在条件命中时，我们就能少访问一次数据库
      return {
        meta:  await this.metaService.getRawMetas(aid),
        buyinfos: await this.buyinfoTable.getByAid(aid)
      }
    } catch (e) {
      console.log(e)
      throw new Error(e)
    }
  }
}

// const service = new BuyinfoService(2112)
// service.getRenderData()
// .then(data => {
//   console.log('40:', data)
// })
// .catch(e => {
//   console.log(e)
// })

module.exports = BuyinfoService
