/**
 * PC站好物页渲染器
 *  形如：http://www.diaox2.com/article/9730.html
 */
const Render = require('../../')
const Utils = require('../../../utils/Utils')
const imageHandler = require('./imageHandler')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const Log = require('../../../utils/Log')
const relsearch = require('../../../api/relsearch')

class ShowRender extends Render {
  constructor (id) {
    super()
    // this.setId(id)
    this.template = this.readTemplate(__dirname + '/show.ejs')
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
  async getRelsearchWords (id) {
    let searchWords = await relsearch(id)
    if (!Utils.isValidArray(searchWords)) return null
    let words = []
    for (let word of searchWords) {
      words.push(`'${word}'`)
    }
    return words.join(',')
  }
  async rende (id, debug) {
    const { parser, metaService } = this
    if (!id) return
    try {
      console.log('pc show render debug:', debug)
      let [metaObj, relwords] = await Promise.all([
        await metaService.setDebug(debug).getRenderData(id),
        this.getRelsearchWords()
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
      let cover = images.filter(img => {
        return (img.type & 2) === img.type
      })
      let thumb = images.filter(img => {
        return (img.type & 8) === img.type
      })
      const swipes = images.filter(img => {
        return (img.type & 16) === img.type
      }) || []
      thumb = Utils.getFirst(thumb) || {}
      cover = Utils.getFirst(cover) || {}
      let date = ''
      if (create_time) {
        console.log(create_time)
        create_time = new Date(create_time)
        let month = create_time.getMonth() + 1
        if (month < 10) {
          month = '0' + month
        }
        date += create_time.getFullYear() + '-'
        date += month + '-'
        date += create_time.getDate()
      }
      console.log('swipes:', swipes)
      return this.getDoc(this.template, {
        id,
        body,
        title,
        author,
        relwords,
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
