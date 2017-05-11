const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const DB = require('../../../db/DB')
/**
 * 渲染：
 *  1. RSS聚合页 http://c.diaox2.com/view/app/?m=rss&type=firstpage
 */
class RssRender extends Render {

  constructor (type) {
    super()
    this.template = this.readTemplate(__dirname + '/rss.ejs')
    this.parser = new Parser
    this.setType(type)
  }

  setType (type) {
    this.type = type
    return this
  }

  // type  = firstpage goodthing zhuankan
  // 1-首页/2-好物/3-专刊/
  async getRenderData (type = this.type) {
    if (!type) return
    let ctype = -1
    let name = null
    if (/firstpage/i.test(type)) {
      ctype = 1
      name = '首页'
    } else if (/goodthing/i.test(type)) {
      ctype = 2
      name = '好物'
    } else if (/zhuankan/i.test(type)) {
      ctype = 3
      name = '专刊'
    }
    if(ctype === -1) return
    const sql = `SELECT meta.id, meta.id * 4294967297 AS longid, meta.title, CONCAT('//',image.url) AS thumb_image_url FROM diaodiao_article_meta as meta, diaodiao_article_image AS image WHERE meta.id = image.aid AND meta.ctype = ${ctype} AND image.type & 8 = 8`
    console.log('[RssRender.getRenderData] sql:', sql);
    return {
      name,
      metas: await DB.exec(sql)
    }
  }

  async rende () {
   const {parser, type} = this
   if(!type) return
   try {
     let limit = 20
     let data = await this.getRenderData(type)
     console.log('[RssRender.rende] data', data)
     let { metas, name } = data
     console.log('[RssRender.rende] metas', metas)
     let allarticles = metas.map(meta => meta.longid)
     return this.getDoc(this.template, {
        name,
        allarticles,
        body: parser.setMetas(metas).getHTML(limit),
        prefix: this.prefix,
        version: this.version
      })
   } catch (e) {
     console.log(e)
   }
  }
}
// var rss = new RssRender('firstpage')
// rss.rende().then(data => {
//   console.log(data)
// })


module.exports = RssRender
