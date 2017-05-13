const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const BuyinfoService = require('../../../service/BuyinfoService')
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. 购买页 http://c.diaox2.com/view/app/?m=buy&aid=2112
 */
class BuyRender extends Render {

  constructor (aid) {
    super()
    this.setAid(aid)
    this.template = this.readTemplate(__dirname + '/buy.ejs')
    this.parser = new Parser
  }

  setAid (aid) {
    this.aid = aid
    return this
  }

  async rende () {
    const {aid} = this
    if(!aid) return
    try {
      let { meta, buyinfos } = await new BuyinfoService(aid).getRenderData()
      let {id, title, thumb_image_url} = meta
      return this.getDoc(this.template, {
        id,
        title,
        thumb_image_url,
        body: this.parser.setBuyinfos(buyinfos).getHTML(),
        prefix: this.prefix,
        version: this.version
      })
    } catch (e) {
      Log.exception(e)
      return null
    }
  }
}

module.exports = BuyRender
