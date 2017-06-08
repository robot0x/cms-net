const Render = require('../../')
const Utils = require('../../../utils/Utils')
const imageHandler = require('./imageHandler')
const skuHandler = require('./skuHandler')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const moment = require('moment')
const request = require('request')
const Promise = require('bluebird')
const relsearch = require('../../../api/relsearch')
const Log = require('../../../utils/Log')
const metaService = new MetaService()
/**
 * 渲染：
 *  1. 首页 goodthing (ctype = 1)    http://c.diaox2.com/view/app/?m=show&id=9669
 *  2. 好物 firstpage (ctype = 2)    http://c.diaox2.com/view/app/?m=show&id=5344
 *  3. 经验 experience (ctype = 1)   http://c.diaox2.com/view/app/?m=show&id=1022
 *  3. 活动 activity (ctype = 1)   http://c.diaox2.com/view/app/?m=show&id=1022
 */
class ShowRender extends Render {
  constructor (id) {
    super()
    this.setId(id)
    this.parser = new Parser()
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
    let tempFile = __dirname + '/show.ejs'
    if (/share/i.test(this.pageType)) {
      tempFile = __dirname + '/share.ejs'
    }
    this.template = this.readTemplate(tempFile)
    return this
  }
  async getRelsearchWords (id = this.id) {
    let searchWords = await relsearch(id)
    if (!Utils.isValidArray(searchWords)) return null
    let words = []
    for (let word of searchWords) {
      words.push(`'${word}'`)
    }
    return words.join(',')
  }
  // 拿出文章关联的所有sku
  async _getSkus (id = this.id) {
    let skus = null
    const result = await Promise.promisify(request)(
      'http://s5.a.dx2rd.com:3000/v1/articlesku/' + id
    )
    let { data } = JSON.parse(result.body)
    skus = data[Utils.toLongId(id)]
    return skus
  }
  async rende () {
    const { parser, id } = this
    if (!id) return
    try {
      let [metaObj, relwords] = await Promise.all([
        metaService.getRenderData(id, true),
        this.getRelsearchWords()
      ])
      metaObj = metaObj || {}
      let {
        content,
        meta,
        author,
        images
      } = metaObj
      author = author || {}
      // console.log('images:', images.length)
      let { title, ctype, timetopublish, price, has_buylink, buylink } = meta || {}
      // let relwords = await this.getRelsearchWords()
      // 在此处进行ctype判断
      parser.markdown = content || '' // markdown is a setter like method `setMarkdown`
      let body = parser.getHTML()
      body = imageHandler(body, images)
      body = await skuHandler(body)
      // console.log(body)
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
      thumb = Utils.getFirst(thumb) || {}
      cover = Utils.getFirst(cover) || {}
      let shouldUsedSku = null
      // 如果是好物页，拿出所有的sku，并取出第一个，赋值给页面的 g_ab 变量，由前端js在页面底部插入这条sku
      if (ctype == 2) {
        const skus = await this._getSkus()
        if (Utils.isValidArray(skus)) {
          shouldUsedSku = Utils.getFirst(skus)
          try {
            shouldUsedSku.images = JSON.parse(shouldUsedSku.images)
          } catch (e) {
            shouldUsedSku.images = []
          }
        }
      }
      // 首页和经验，顶部出的一定是时间
      // 好物有price出price，否则出时间
      if (ctype === 1 || ctype === 5) {
        price = ''
      }
      return this.getDoc(this.template, {
        id,
        body,
        title,
        author,
        swipes,
        thumb,
        cover,
        price,
        date: timetopublish
          ? moment(timetopublish, 'YYYYMMDD').format('YYYY-MM-DD')
          : '',
        relwords,
        shouldUsedSku,
        type: Utils.ctypeToType(ctype),
        has_buylink,
        //  如果有购买链接且购买链接是sku页，则需要转成 /sku/longid/sid.html这种形式，用来进行统计
        buylink: Utils.convertSkuUrl(buylink, id),
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
//
// var show = new ShowRender(1)
// show.rende()

// const parser = new Parser(`
// 这个段落中含有我们的其他文章的链接\n\n这个段落中含有引用非文章链接\n\n技术支持：有问题报给@李彦峰（大哥）
// `)
// console.log(parser.getHTML())

module.exports = ShowRender
