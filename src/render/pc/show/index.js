/**
 * PC站好物页渲染器
 *  形如：http://www.diaox2.com/article/9730.html
 */
const Render = require('../../')
const Utils = require('../../../utils/Utils')
const SKU = require('../../../utils/SKU')
const imageHandler = require('./imageHandler')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const Log = require('../../../utils/Log')
const relsearch = require('../../../api/relsearch')
const BuyinfoTable = require('../../../db/BuyinfoTable')

class ShowRender extends Render {
  constructor (id) {
    super()
    // this.setId(id)
    this.template = this.readTemplate(__dirname + '/show.ejs') // eslint-disable-line
    this.parser = new Parser()
    this.metaService = new MetaService()
    this.buyinfoTable = new BuyinfoTable()
  }
  /**
    * 在 cms-net.js 中调用，解析url参数之后，调用setId
    */
  // setId (id) {
  //   this.id = id
  //   return this
  // }
  async getRelsearchWords (id) {
    let searchWords = await relsearch(id)
    if (!Utils.isValidArray(searchWords)) return null
    let words = []
    for (let word of searchWords) {
      words.push(`'${word}'`)
    }
    return words.join(',')
  }
  async getSales (id) {
    let [skus, buyInfos] = await Promise.all([
      SKU.getSkusByArticleId(id),
      this.buyinfoTable.getByAid(id)
    ])
    // console.log('skus:', skus);
    // console.log('buyInfos:', buyInfos);
    let ret = Object.create(null)
    ret.sales = []
    if (SKU.isOnlyOneOnlineSKU(skus)) {
      let {sales} = skus[0]
      for (let skuSale of sales) {
        let {mart, intro, price, link_pc_cps, link_m_cps, link_pc_raw, link_m_raw} = skuSale
        let sale = Object.create(null)
        sale.mart = mart
        sale.intro = intro
        sale.price = price
        sale.link = link_pc_cps || link_m_cps || link_pc_raw || link_m_raw // eslint-disable-line
        ret.sales.push(sale)
      }
      ret.from = 'sku'
    } else if (Utils.isValidArray(buyInfos)) {
      for (let buyInfo of buyInfos) {
        let sale = Object.create(null)
        let {mart, intro, price, link_pc, link} = buyInfo
        sale.mart = mart
        sale.intro = intro
        sale.price = price
        sale.link = link_pc || link // eslint-disable-line
        ret.sales.push(sale)
      }
      ret.from = 'buy'
    }
    // console.log('ret:', ret)
    return ret
  }
  async rende (id) {
    const { parser, metaService } = this
    if (!id) return
    try {
      let [metaObj, relwords, buylink] = await Promise.all([
        metaService.getRenderData(id),
        this.getRelsearchWords(),
        this.getSales(id)
      ])
      metaObj = metaObj || {}
      relwords = relwords || []
      let { content, meta, author, images } = metaObj
      content = content || ''
      meta = meta || {}
      images = images || []
      author = author || {}
      let { title, ctype, create_time, price } = meta
      title = title || ''
      price = price || ''
      // 在此处进行ctype判断
      parser.markdown = content // markdown is a setter like method `setMarkdown`
      let body = parser.getHTML()
      body = imageHandler(body, images)
      //  0未设置类型,没有被使用/第1位-内容图(1)/第2位cover图(2)/第3位coverex图(4)/第4位thumb图(8)/第5位swipe图(16)/第6位banner图(32)
      /**
       * BUG: 如果type为0的话，则
       * img.type & 2 === img.type 一直是成立的
       */
      let cover = images.filter(img => {
        return (img.type & 2) === 2
      })
      let thumb = images.filter(img => {
        return (img.type & 8) === 8
      })
      const swipes = images.filter(img => {
        return (img.type & 16) === 16
      }) || []
      thumb = Utils.getFirst(thumb) || {}
      cover = Utils.getFirst(cover) || {}
      let date = ''
      if (create_time) {  // eslint-disable-line
        console.log(create_time)
        create_time = new Date(create_time) // eslint-disable-line
        let month = create_time.getMonth() + 1
        if (month < 10) {
          month = '0' + month
        }
        date += create_time.getFullYear() + '-'
        date += month + '-'
        date += create_time.getDate()
      }
      // console.log('swipes:', swipes)
      /**
       * 如果有且仅有一个sku，则用sku，
       * 若不满足上述条件，则取diaodiao_buyinfo
       *
       * 若是sku，则使用链接的顺序为 link_pc_cps || link_m_cps || link_pc_raw || like_m_raw
       * 若是buyinfo，则使用链接的顺序为 link_pc || link
       */
      return this.getDoc(this.template, {
        id,
        body,
        title,
        author,
        relwords,
        buylink,
        type: Utils.ctypeToType(ctype),
        version: this.version,
        swipes,
        thumb,
        cover,
        price,
        date
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
