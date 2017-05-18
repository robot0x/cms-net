const Render = require('../../')
const Utils = require('../../../utils/Utils')
// const imageHandler = require('./imageHandler')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. 专刊 zhuankan (ctype = 4)    http://c.diaox2.com/view/app/?m=zk&id=3053
 */
class ZKRender extends Render {
  constructor (id) {
    super()
    this.setId(id)
    this.template = this.readTemplate(require('path').resolve(__dirname, 'zk.ejs'))
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
    const { parser, id, metaService } = this
    if (!id) return
    try {
      let { content, meta, images } = await metaService.getRenderData(id)
      let { title } = meta
      parser.markdown = content // markdown is a setter like method `setMarkdown`
      //  对于专刊，我们要先取出所引用的所有文章id
      let cids = Utils.getCidByMarkdown(content)
      let buylinks = []
      // 先读diaodiao_buyinfo表
      // 根据文章id获取其buylink
      for (let cid of cids) {
        let buylink = await metaService.getBuylink(cid)
        buylinks.push({ cid, link: Utils.convertSkuUrl(buylink, cid) })
      }
      let body = parser.setBuylinks(buylinks).getHTML()
      // console.log(`ID为${id}的专刊引用的文章ID列表为：`,cids)
      // body = imageHandler(body, images)
      //  0未设置类型,没有被使用/第1位-内容图(1)/第2位cover图(2)/第3位coverex图(4)/第4位thumb图(8)/第5位swipe图(16)/第6位banner图(32)
      let cover = images.filter(img => {
        return (img.type & 2) === 2
      })
      let thumb = images.filter(img => {
        return (img.type & 8) === 8
      })
      const swipes = images.filter(img => {
        return (img.type & 16) === 16
      })
      thumb = Utils.getFirst(thumb)
      cover = Utils.getFirst(cover)
      return this.getDoc(this.template, {
        id,
        title,
        body,
        swipes,
        thumb,
        cover,
        pageType: this.pageType,
        downloadAddr: this.downloadAddr,
        prefix: this.prefix,
        version: this.version
      })
    } catch (e) {
      Log.exception(e)
      return null
    }
  }
}
module.exports = ZKRender
