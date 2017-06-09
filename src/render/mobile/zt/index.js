const Render = require('../../')
const Utils = require('../../../utils/Utils')
const articleHandler = require('./articleHandler')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const Log = require('../../../utils/Log')

/**
 * 渲染：
 *  1. 专题 zhuanti (ctype = 9)    http://c.diaox2.com/view/app/?m=zt&id=7080
 */
class ZTRender extends Render {
  constructor (id) {
    super()
    this.setId(id)
    this.template = this.readTemplate(require('path').resolve(__dirname, 'zt.ejs'))
    this.parser = new Parser()
    this.metaService = new MetaService()
  }
  /**
   * 在 cms-net.js 中调用，解析url参数之后，调用setId
   */
  setId (id) {
    this.id = id
    return this
  }

  /**
   * type:
   *  app、      app内看的页面
   *  share、    share页
   *  aladin、   百度阿拉丁
   *  flipboard、
   *  jike       即刻
   */
  setPageType (pageType) {
    this.pageType = pageType
    return this
  }

  async rende () {
    const { parser, id, metaService, debug } = this
    if (!id) return
    try {
      let { content, meta, images } = (await metaService.setDebug(debug).getRenderData(id)) || {}
      content = content || ''
      meta = meta || {}
      images = images || []
      // console.log('zt markdown 37:', content)
      parser.markdown = content // markdown is a setter like method `setMarkdown`
      let {title} = meta
      title = title || ''
      let body = parser
      .setTitle(title)
      .getHTML()
      body = await articleHandler(body, content)
      //  0未设置类型,没有被使用/第1位-内容图(1)/第2位cover图(2)/第3位coverex图(4)/第4位thumb图(8)/第5位swipe图(16)/第6位banner图(32)
      let cover = images.filter(img => {
        return (img.type & 2) === img.type
      })
      let thumb = images.filter(img => {
        return (img.type & 8) === img.type
      })
      // const swipes = images.filter(img => {
      //   return (img.type & 16) === img.type
      // }) || []

      thumb = Utils.getFirst(thumb) || {}
      cover = Utils.getFirst(cover) || {}

      return this.getDoc(this.template, {
        id,
        title,
        body,
        // swipes,
        thumb,
        cover,
        pageType: this.pageType,
        downloadAddr: this.downloadAddr,
        prefix: this.prefix,
        version: this.version
      })
    } catch (e) {
      console.log(e)
      Log.exception(e)
      return null
    }
  }
}
module.exports = ZTRender
