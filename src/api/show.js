// const DB = require('../db/DB')
const MetaTable = require('../db/MetaTable')
const metaTable = new MetaTable()
const Parser = require('../parser')
const parser = new Parser()
const Log = require('../utils/Log')
const Utils = require('../utils/Utils')

const ContentTable = require('../db/ContentTable')
const contentTable = new ContentTable()
const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const AuthorService = require('../service/AuthorService')
const authorService = new AuthorService()
const TagService = require('../service/TagService')
const tagService = new TagService()
class Show {
  setType (type) {
    this.type = type
    return this
  }

  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到专刊类型的渲染数据
   */
  async getZKData (id) {
    Log.business('[API show showZK] 输入参数为：', id)
    const markdown = await contentTable.getById(id)
    if (!markdown) return null
    const allCardReg = /```card[\s\S]+?```/ig
    const zkReg = /```zk[\s\S]+?```/ig
    const allCardMarkdown = markdown.match(allCardReg)
    let zkMarkdown = markdown.match(zkReg)
    if (!Utils.isValidArray(zkMarkdown)) return null
    zkMarkdown = Utils.getFirst(zkMarkdown)
    console.log(zkMarkdown)
    const idReg = /id[:：]\s*(\d+)\s*title[:：]/
    const titleReg = /title[:：]\s*(.+)\s*desc[:：]/
    const descReg = /desc[:：]\s*(.+)\s*image[:：]/
    const imageReg = /image[:：]\s*!\[.*\]\((?:https?)?(?:\/\/)?(.+)\s*\)\s*/
    let title = zkMarkdown.match(titleReg)
    let desc = zkMarkdown.match(descReg)
    let image = zkMarkdown.match(imageReg)
    if (Utils.isValidArray(title)) {
      title = title[1]
    }
    if (Utils.isValidArray(desc)) {
      desc = desc[1]
    }
    if (Utils.isValidArray(image)) {
      image = image[1]
    }
    const ret = Object.create(null)
    ret.title = title
    ret.desc = desc
    ret.image = image
    let metas = []
    for (let cardMarkdown of allCardMarkdown) {
      let card = Object.create(null)
      let cardId = cardMarkdown.match(idReg)
      let cardTitle = cardMarkdown.match(titleReg)
      let cardDesc = cardMarkdown.match(descReg)
      let cardImage = cardMarkdown.match(imageReg)
      if (Utils.isValidArray(cardId)) {
        cardId = cardId[1]
      }
      if (Utils.isValidArray(cardTitle)) {
        cardTitle = cardTitle[1]
      }
      if (Utils.isValidArray(cardDesc)) {
        cardDesc = cardDesc[1]
      }
      if (Utils.isValidArray(cardImage)) {
        cardImage = cardImage[1]
      }
      card.id = Number(cardId)
      card.title = cardTitle
      card.desc = cardDesc
      card.image = cardImage
      card.buylink = await metaService.getBuylink(cardId)
      metas.push(card)
    }
    ret.metas = metas
    return ret
  }
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到专题类型的渲染数据
   */
  async getZTData (id) {
    Log.business('[API show showZK] 输入参数为：', id)
    const markdown = await contentTable.getById(id)
    if (!markdown) return null
    const allCardReg = /```card[\s\S]+?```/ig
    const ztReg = /```zt[\s\S]+?```/ig
    const allCardMarkdown = markdown.match(allCardReg)
    let ztMarkdown = markdown.match(ztReg)
    if (!Utils.isValidArray(ztMarkdown)) return null
    ztMarkdown = Utils.getFirst(ztMarkdown)
    const idReg = /id[:：]\s*(\d+)\s*title[:：]/
    const titleReg = /title[:：]\s*(.+)\s*desc[:：]/
    const descReg = /desc[:：]\s*(.+)\s*image[:：]/
    const imageReg = /image[:：]\s*!\[.*\]\((?:https?)?(?:\/\/)?(.+)\s*\)\s*/
    let title = ztMarkdown.match(titleReg)
    let desc = ztMarkdown.match(descReg)
    if (Utils.isValidArray(title)) {
      title = title[1]
    }
    if (Utils.isValidArray(desc)) {
      desc = desc[1]
    }
    const ret = Object.create(null)
    ret.title = title
    ret.desc = desc || ''
    let metas = []
    for (let cardMarkdown of allCardMarkdown) {
      let card = Object.create(null)
      let cardId = cardMarkdown.match(idReg)
      let cardTitle = cardMarkdown.match(titleReg)
      let cardDesc = cardMarkdown.match(descReg)
      let cardImage = cardMarkdown.match(imageReg)
      if (Utils.isValidArray(cardId)) {
        cardId = cardId[1]
      }
      if (Utils.isValidArray(cardTitle)) {
        cardTitle = cardTitle[1]
      }
      if (Utils.isValidArray(cardDesc)) {
        cardDesc = cardDesc[1]
      }
      if (Utils.isValidArray(cardImage)) {
        cardImage = cardImage[1]
      }
      card.id = Number(cardId)
      card.title = cardTitle
      card.desc = cardDesc
      card.image = cardImage
      metas.push(card)
    }
    ret.metas = metas
    return ret
  }
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到firstpage/goodthing/activity/exprience类型的渲染数据
   */
  async getArticleData (id) {
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
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到ctype，然后在路由到取相应数据的方法
   */
  async getZKAndZTAndArticleData (id) {
    const trueM = Utils.ctypeToM(await metaTable.getCtypeById(id))
    console.log('trueM:', trueM)
    let data = null
    console.log('trueM:', trueM)
    switch (trueM) {
      case 'show': // 正文页渲染 firstpage/goodthing/activity/exprience
        data = await this.getArticleData(id)
        break
      case 'zk': // 专刊页渲染
        data = await this.getZKData(id)
        break
      case 'zt': // 专刊页渲染
        data = await this.getZTData(id)
        break
    }
    // console.log(data)
    return data
  }
  /**
   * @param {string} src
   * @memberof Show
   * 根据source拿到作者页的渲染数据
   */
  async getAuthorData (src) {
    let data = await authorService.setSource(src).getRenderData()
    let ret = Object.create(null)
    ret.author = data.author
    ret.metas = []
    for (let meta of data.metas) {
      ret.metas.push({
        id: meta.nid,
        ctype: meta.ctype,
        image: meta.thumb_image_url,
        title: meta.title.join()
      })
    }
    return ret
  }
  /**
   * @param {number} tid
   * @memberof Show
   * 根据tag id拿到tag页的渲染数据
   */
  async getTagData (tid) {
    let data = await tagService.setTid(tid).getRenderData(true, true, false, true)
    let ret = Object.create(null)
    ret.name = data.name
    ret.metas = data.metas
    const findImageById = (id, images) => {
      for (let img of images) {
        if (img.aid === id) {
          return img.url
        }
      }
    }
    for (let meta of ret.metas) {
      meta.image = findImageById(meta.id, data.images)
    }
    return ret
  }
  /**
   * @memberof Show
   * 对外暴露的接口，根据在 router.js 中所set的type的不同，路由到相应的取数据的方法
   */
  getData (param) {
    const {type} = this
    if (/show/i.test(type)) {
      return this.getZKAndZTAndArticleData(param)
    } else if (/author/i.test(type)) {
      return this.getAuthorData(param)
    } else if (/tag/i.test(type)) {
      return this.getTagData(param)
    }
    return null
  }
}

module.exports = Show

// async function show (id) {
//   const trueM = Utils.ctypeToM(await metaTable.getCtypeById(id))
//   let data = null
//   console.log('trueM:', trueM)
//   switch (trueM) {
//     case 'show': // 正文页渲染 firstpage/goodthing/activity/exprience
//       data = await showArticle(id)
//       break
//     case 'zk': // 专刊页渲染
//       data = await showZK(id)
//       break
//     case 'zt': // 专刊页渲染
//       data = await showZT(id)
//       break
//   }
//   // console.log(data)
//   return data
// }

// async function showArticle (id) {
//   Log.business('[API show showArticle] 输入参数为：', id)
//   try {
//     let content = await contentTable.getById(id)
//     // (useBuylink = true, isShortId = false, useCoverex = false, useBanner = false, useSwipe = false , useImageSize = false)
//     let meta = await metaService.getRawMetas(
//       id,
//       false,
//       true,
//       false,
//       false,
//       true
//     )
//     let { swipe_image_url, title, price, author } = meta
//     parser.markdown = content
//     return {
//       header: {
//         title: Utils.getFirst(title),
//         price: { type: 'price', value: price },
//         banners: swipe_image_url,
//         author: { url: author.pic, value: author.name }
//       },
//       contents: parser.getData()
//     }
//   } catch (e) {
//     Log.exception(e)
//     return null
//   }
// }

// async function showZK (id) {
//   Log.business('[API show showZK] 输入参数为：', id)
// }

// async function showZT (id) {
//   Log.business('[API show showZT] 输入参数为：', id)
// }

// module.exports = show
