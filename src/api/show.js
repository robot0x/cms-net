// const DB = require('../db/DB')
const Utils = require('../utils/Utils')
const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const ContentTable = require('../db/ContentTable')
const contentTable = new ContentTable()
const MetaTable = require('../db/MetaTable')
const metaTable = new MetaTable()
const Parser = require('../parser')
const parser = new Parser()
const Log = require('../utils/Log')

async function show (id) {
  const trueM = Utils.ctypeToM(await metaTable.getCtypeById(id))
  let data = null
  console.log('trueM:', trueM)
  switch (trueM) {
    case 'show': // 首页渲染
      data = await showArticle(id)
      break
    case 'zk': // 好物页渲染
      data = await showZK(id)
      break
    case 'zt': // 专刊页渲染
      data = await showZT(id)
      break
  }
  // console.log(data)
  return data
}

async function showArticle (id) {
  Log.business('[API show showArticle] 输入参数为：', id)
  try {
    let content = await contentTable.getById(id)
    // (useBuylink = true, isShortId = false, useCoverex = false, useBanner = false, useSwipe = false , useImageSize = false)
    let meta = await metaService.getRawMetas(
      id,
      false,
      true,
      false,
      false,
      true
    )
    let { swipe_image_url, title, price, author } = meta
    parser.markdown = content
    return {
      header: {
        title: Utils.getFirst(title),
        price: { type: 'price', value: price },
        banners: swipe_image_url,
        author: { url: author.pic, value: author.name }
      },
      contents: parser.getData()
    }
  } catch (e) {
    Log.exception(e)
    return null
  }
}

async function showZK (id) {
  Log.business('[API show showZK] 输入参数为：', id)
}

async function showZT (id) {
  Log.business('[API show showZT] 输入参数为：', id)
}

module.exports = show
