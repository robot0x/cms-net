const Render = require('../../')
// const Utils = require('../../../utils/Utils')
const Log = require('../../../utils/Log')
const Parser = require('./parser')
const AuthorService = require('../../../service/AuthorService')
/**
 * 渲染：
 *  1. 作者页 http://www.diaox2.com/editor/ZRJ.html
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
      //  相当于then
      let { metas, author } = await authorService.getRenderData(source)
      if (!metas) {
        return { status: '404' }
      } else {
        return this.getDoc(this.template, {
          author,
          body: parser.getHTML(metas),
          version: this.version
        })
      }
    } catch (e) {
      Log.exception(e)
      return null
    }
  }
}
//
// var author = new AuthorRender(1)
// show.rende()

// console.log(parser.getHTML())

module.exports = AuthorRender
