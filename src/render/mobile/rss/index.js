const Render = require('../../')
const Parser = require('./parser')
const Utils = require('../../../utils/Utils')
const DB = require('../../../db/DB')
const Log = require('../../../utils/Log')
// const ImageTable = require('../../../db/ImageTable')
// const imageTable = new ImageTable()
/**
 * 渲染：
 *  1. RSS聚合页 http://c.diaox2.com/view/app/?m=rss&type=firstpage
 */
class RssRender extends Render {
  constructor (type) {
    super()
    this.template = this.readTemplate(__dirname + '/rss.ejs')
    this.parser = new Parser()
    // this.setType(type)
  }

  // setType (type) {
  //   this.type = type
  //   return this
  // }

  // type  = firstpage goodthing zhuankan
  // 1-首页/2-好物/3-专刊/
  async getRenderData (type) {
    if (!type) return
    let ctypes = []
    let types = type.split(/\s/)
    if (!Utils.isValidArray(types)) return
    let name = ''
    for (let t of types) {
      let c = -1
      // 经验的ctype不是5
      if (/firstpage/i.test(t)) {
        c = 1
        name += '热门文章'
      } else if (/goodthing/i.test(t)) {
        c = 2
        name += '好物'
      } else if (/zhuankan/i.test(t)) {
        c = 3
        name += '专刊'
      } else if (/activity/i.test(t)) {
        c = 4
        name += '活动'
      } else if (/experience/i.test(t)) {
        c = 5
        name += '经验'
      } else if (/zhuanti/i.test(t)) {
        c = 9
        name += '专题'
      }
      if (c !== -1) {
        ctypes.push(c)
      }
    }
    if (!Utils.isValidArray(ctypes)) return
    // 有很多文章的timetopublush是相同的，所以，应该用 timetopublish和id联合排序，不然刷新rss页，会导致文章顺序会变
    const sql = `SELECT meta.id, meta.id * 4294967297 AS longid, meta.title, meta.ctype, meta.timetopublish, CONCAT('//',image.url) AS thumb_image_url FROM diaodiao_article_meta AS meta, diaodiao_article_image AS image WHERE meta.id = image.aid AND meta.ctype IN (${ctypes.join(',')}) AND image.type & 8 = 8 AND ${Utils.genTimetopublishInterval('timetopublish', true)} ORDER BY meta.timetopublish DESC, meta.id DESC`
    // bugsql
    // const sql = `SELECT meta.id, meta.id * 4294967297 AS longid, meta.title, meta.ctype, meta.timetopublish, CONCAT('//',image.url) AS thumb_image_url FROM diaodiao_article_meta as meta, diaodiao_article_image AS image WHERE meta.id = image.aid AND meta.ctype IN (${ctypes.join(',')}) AND image.type & 8 = 8 AND ${Utils.genTimetopublishInterval('timetopublish', true)} ORDER BY timetopublish, meta.id DESC`
    // TODO: 数据重复bug
    // const sql = `SELECT meta.id, meta.id * 4294967297 AS longid, meta.title, meta.ctype, meta.timetopublish, CONCAT('//',image.url) AS thumb_image_url FROM diaodiao_article_meta as meta WHERE meta.ctype IN (${ctypes.join(',')}) AND ${Utils.genTimetopublishInterval()} ORDER BY timetopublish DESC`
    // const thumb = await imageTable.getSpecialImagesUrl()
    // console.log('[RssRender.getRenderData] sql:', sql);
    const metas = (await DB.exec(sql)) || []
    return { name, metas }
  }

  async rende (type) {
    const { parser } = this
    if (!type) return
    try {
      let limit = 20
      let data = await this.getRenderData(type)
      //  console.log('[RssRender.rende] data', data)
      let { metas, name } = data
      //  console.log('[RssRender.rende] metas', metas)
      let allarticles = metas.map(meta => meta.longid)
      return this.getDoc(this.template, {
        name,
        allarticles,
        body: parser.setMetas(metas).getHTML(limit),
        prefix: this.prefix,
        version: this.version
      })
    } catch (e) {
      Log.exception(e)
      return null
    }
  }
}

// var rss = new RssRender('firstpage')
// rss.rende().then(data => {
//   console.log(data)
// })

module.exports = RssRender
