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
  constructor () {
    super()
    // this.setId(id)
    this.template = this.readTemplate(__dirname + '/zk.ejs')
    this.parser = new Parser()
    this.metaService = new MetaService()
  }
  /**
   * 在 cms-net.js 中调用，解析url参数之后，调用setId
   */
  // setId (id) {
  //   this.id = id
  //   return this
  // }
  async rende (id) {
    const { parser, metaService } = this
    if (!id) return
    try {
      let { content, meta, images } = (await metaService.getRenderData(id)) || {}
      content = content || ''
      meta = meta || {title: '', titleex: ''}
      let { title, titleex } = meta
      parser.markdown = content // markdown is a setter like method `setMarkdown`
      //  对于专刊，我们要先取出所引用的所有文章id
      let data = Utils.getZkDataByParseMarkdown(content) || {}
      // console.log(data)
      let {article, ids} = data
      article = article || {}
      ids = ids || []
      // body = imageHandler(body, images)
      //  0未设置类型,没有被使用/第1位-内容图(1)/第2位cover图(2)/第3位coverex图(4)/第4位thumb图(8)/第5位swipe图(16)/第6位banner图(32)
      let cover = images.filter(img => {
        return (img.type & 2) === img.type
      })
      let thumb = images.filter(img => {
        return (img.type & 8) === img.type
      })
      // const swipes = images.filter(img => {
      //   return (img.type & 16) === img.type
      // })
      thumb = Utils.getFirst(thumb) || {}
      cover = Utils.getFirst(cover) || {}
      parser
          .setCover(cover)
          .setTitle(title)
          .setTitleex(titleex)
          .setArticle(article)
          .getHTML()
      let {header, body} = parser
      body = await articleHandler(body, ids)
      parser.header = parser.body = ''
      return this.getDoc(this.template, {
        id,
        title,
        titleex,
        header,
        body,
        version: this.version,
        // swipes,
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
