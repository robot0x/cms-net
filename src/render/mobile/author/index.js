const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const AuthorService = require('../../../service/AuthorService')
const Log = require('../../../utils/Log')
// const defaultAuthor = require('../../../../config/app').defaultAuthor
/**
 * 渲染：
 *  1. 作者页
 *   http://c.diaox2.com/view/app/?m=author&src=ZRJ
 *   http://www.diaox2.com/editor/ZRJ.html
 */
class AuthorRender extends Render {
  constructor (src) {
    super()
    // this.setSource(src)
    this.template = this.readTemplate(__dirname + '/author.ejs')
    this.parser = new Parser()
    this.authorService = new AuthorService()
  }
  /**
   * 在 cms-net.js 中调用，解析url参数之后，调用setId
   */
  // setSource (src) {
  //   this.source = src
  //   return this
  // }

  async rende (source) {
    const { parser, authorService } = this
    if (!source) return
    try {
      let { metas, author } = await authorService.getRenderData(source)
      metas = metas || []
      let allarticles = metas.map(meta => Utils.toLongId(meta.nid))
      let infos = Object.create(null)
      allarticles.forEach((id, index) => {
        infos[id] = metas[index].title.join('')
      })
      // 处理author，如果type为www，则value为link，如果type为wechat，则value为naming + value
      let authorType = author.type
      if (/wechat/i.test(authorType)) {
        author.value = author.naming + author.value
      } else if (/w{3}/i.test(authorType)) {
        author.value = `<a href="${author.link}">${(Utils.removeProtocolHead(author.link) || '').replace(/\/$/, '')}</a>`
      }
      return this.getDoc(this.template, {
        allarticles: JSON.stringify(allarticles),
        infos: JSON.stringify(infos),
        author,
        body: parser.getHTML(metas, 20),
        prefix: this.prefix,
        version: this.version
      })
    } catch (e) {
      Log.exception(e)
      return null
    }
  }
}
// var author = new AuthorRender(1)
// show.rende()
// console.log(parser.getHTML())

module.exports = AuthorRender
