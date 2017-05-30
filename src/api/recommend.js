const DB = require('../db/DB')
const Utils = require('../utils/Utils')
const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const _ = require('lodash')
const Log = require('../utils/Log')
const LIMIT = 15 // 限制15条

function genSimpleMeta (meta) {
  if (meta) {
    // let { nid, title, type, ctype } = meta
    let { nid, title, ctype } = meta
    let titleex = ''
    if (title.length > 1) {
      [title, titleex] = title
    } else if (title.length === 1) {
      [title] = title
    }
    return {
      title,
      titleex,
      type: meta.type,
      thumb: meta.thumb_image_url,
      cover: meta.cover_image_url,
      serverid: Utils.toLongId(nid),
      url: `//c.diaox2.com/view/app/?m=${Utils.ctypeToM(ctype)}&id=${nid}`
    }
  }
  return null
}
// [{
//   "title":"\u597d\u7b14\u5e76\u4e0d\u662f\u53ea\u6709\u4e07\u5b9d\u9f99",
//   "titleex":"",
//   "type":"firstpage",
//   "thumb":"\/\/content.image.alimmdn.com\/cms\/sites\/default\/files\/20141015\/firstpage\/00_5.jpg",
//   "cover":"\/\/content.image.alimmdn.com\/cms\/sites\/default\/files\/20141121\/firstpage\/1122pen.jpg",
//   "serverid":197568495662,
//   "url":"\/\/c.diaox2.com\/cms\/diaodiao\/articles\/firstpage\/46_46.html"
// }]
async function recommend (id) {
  if (!id) return null
  Log.business('[API recommend] 输入参数为：', id)
  // diaodiao_article_recommend, diaodiao_hot_goodthing
  // 先从 diaodiao_article_recommend 拿，若没有，再去diaodiao_hot_goodthing拿，若多于15条，则截断
  let rel_articles = null
  let simpleMetas = null
  try {
    let rel_articlesSQL = `SELECT rel_article FROM diaodiao_article_recommend WHERE ori_article = ${id}`
    rel_articles = Utils.getFirst(await DB.exec(rel_articlesSQL))
    Log.business(
      `[API recommend] ${rel_articlesSQL}\nfetch data is ${rel_articles} `
    )
    if (rel_articles) {
      rel_articles = rel_articles.rel_article.split(/,/)
    } else {
      // 从热门里拿时，不用 like，直接拿最新一条的热门（timestamp最大的）
      let sql = `SELECT hot_goodthing_list FROM diaodiao_hot_goodthing ORDER BY timestamp DESC LIMIT 1`
      let results = await DB.exec(sql)
      Log.business(`[API recommend] ${sql}\nfetch data is ${results} `)
      // let results = await DB.exec(`SELECT hot_goodthing_list FROM diaodiao_hot_goodthing WHERE hot_goodthing_list LIKE '%${id}%' ORDER  BY timestamp DESC`)
      // let ids = null
      let result = null
      if (Utils.isValidArray(results)) {
        result = Utils.getFirst(results)
        if (result) {
          rel_articles = _.union(result.hot_goodthing_list.split(',')) // 去重并去掉本id
        }
      }
    }

    if (!Utils.isValidArray(rel_articles)) return null

    if (rel_articles.length > LIMIT) {
      rel_articles = rel_articles.slice(0, LIMIT)
    }

    const metas = await metaService.getRawMetas(rel_articles, false, true)
    if (metas) {
      simpleMetas = []
      let simpleMeta = null
      if (Array.isArray(metas)) {
        for (let meta of metas) {
          simpleMeta = genSimpleMeta(meta)
          if (simpleMeta) {
            simpleMetas.push(simpleMeta)
          }
        }
      } else if (!_.isEmpty(metas)) {
        simpleMeta = genSimpleMeta(metas)
        if (simpleMeta) {
          simpleMetas.push(simpleMeta)
        }
      }
    }
  } catch (error) {
    Log.exception(error)
  }
  return simpleMetas
}

module.exports = recommend
