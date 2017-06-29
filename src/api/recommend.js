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
/**
 * 2017-6-29 发现在pc值得买上调用推荐接口不传id，要考虑到这种情况
 * @param {number} id 
 * @param {string} cb
 */
async function recommend (id, cb) {
  // if (!id) return null
  // Log.business('[API recommend] 输入参数为：', id)
  // diaodiao_article_recommend, diaodiao_hot_goodthing
  // 先从 diaodiao_article_recommend 拿，若没有，再去diaodiao_hot_goodthing拿，若多于15条，则截断
  let relArticles = null
  let simpleMetas = null
  try {
    /**
     * 经过跟大叔商量，如果id为空，则直接去diaodiao_hot_goodthing拿数据
     * 所以，
     * 如果没有传id，在router.js中已经把id置为了-1，所以relArticles一定是空的，relArticles为空就去diaodiao_hot_goodthing拿数据
     * 正好实现了这个策略
     */
    let relArticlesSQL = `SELECT rel_article FROM diaodiao_article_recommend WHERE ori_article = ${id}`
    relArticles = Utils.getFirst(await DB.exec(relArticlesSQL))
    Log.business(
      `[API recommend] ${relArticlesSQL}\nfetch data is ${relArticles} `
    )
    if (relArticles) {
      relArticles = relArticles.rel_article.split(/,/)
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
          relArticles = _.union(result.hot_goodthing_list.split(',')) // 去重并去掉本id
        }
      }
    }

    if (!Utils.isValidArray(relArticles)) return null

    if (relArticles.length > LIMIT) {
      relArticles = relArticles.slice(0, LIMIT)
    }

    const metas = await metaService.getRawMetas(relArticles, false, true)
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
  if (cb) {
    return `${cb}(${JSON.stringify(simpleMetas)})`
  }
  return simpleMetas
}

module.exports = recommend
