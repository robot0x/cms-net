const Render = require('../../')
const Utils = require('../../../utils/Utils')
const articleHandler = require('./articleHandler')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. 专刊 zhuankan (ctype = 4)   http://www.diaox2.com/article/4234.html
 */
class ZKRender extends Render {
  constructor (id) {
    super()
    this.setId(id)
    this.template = this.readTemplate(__dirname + '/zk.ejs')
    this.parser = new Parser()
  }
  /**
   * 在 cms-net.js 中调用，解析url参数之后，调用setId
   */
  setId (id) {
    this.id = id
    return this
  }

  async rende () {
    const { parser, id } = this
    if (!id) return
    try {
      let { content, meta, images } = await new MetaService(
        this.id
      ).getRenderData()
      let { title, titleex } = meta
      parser.markdown = content // markdown is a setter like method `setMarkdown`
      let body = parser.getHTML()
      // body = imageHandler(body, images)
      //  0未设置类型,没有被使用/第1位-内容图(1)/第2位cover图(2)/第3位coverex图(4)/第4位thumb图(8)/第5位swipe图(16)/第6位banner图(32)
      let cover = images.filter(img => {
        return (img.type & 2) === img.type
      })
      let thumb = images.filter(img => {
        return (img.type & 8) === img.type
      })
      const swipes = images.filter(img => {
        return (img.type & 16) === img.type
      })

      thumb = Utils.getFirst(thumb)
      cover = Utils.getFirst(cover)

      return this.getDoc(this.template, {
        id,
        title,
        titleex,
        body,
        version: this.version,
        swipes,
        thumb,
        cover
      })
    } catch (e) {
      console.log(e)
      Log.exception(e)
      return null
    }
  }
}
module.exports = ZKRender
