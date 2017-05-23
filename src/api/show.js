// const DB = require('../db/DB')
const MetaTable = require('../db/MetaTable')
const metaTable = new MetaTable()
const ImageTable = require('../db/ImageTable')
const imageTable = new ImageTable()
const Parser = require('../parser')
const parser = new Parser()
const Log = require('../utils/Log')
const Utils = require('../utils/Utils')
// const DB = require('../db/DB')
const ContentTable = require('../db/ContentTable')
const contentTable = new ContentTable()
const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const AuthorService = require('../service/AuthorService')
const authorService = new AuthorService()
const TagService = require('../service/TagService')
const tagService = new TagService()
const request = require('request')
const recommend = require('./recommend')
const Promise = require('bluebird')
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
  async getZKData (id, ctype) {
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
    ret.ctype = ctype
    ret.metas = metas
    return ret
  }

  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到专题类型的渲染数据
   */
  async getZTData (id, ctype) {
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
    ret.ctype = ctype
    return ret
  }
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到firstpage/goodthing/activity/exprience类型的渲染数据
   */
  async getArticleData (id, ctype) {
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
      let goods = await recommend(id)
      goods = goods.map(good => {
        // console.log(good.type)
        return {
          image: good.thumb,
          title: good.title,
          ctype: Utils.typeToCtype(good.type),
          article_id: Utils.toShortId(good.serverid)
          // price: 239
        }
      })
      return {
        ctype,
        header: {
          title: Utils.getFirst(title),
          price: { type: 'price', value: price },
          banners: swipe_image_url,
          author: { url: author.pic, value: author.name }
        },
        contents: parser.getData(),
        goods
      }
    } catch (e) {
      Log.exception(e)
      return null
    }
  }
  // 拿出文章关联的所有sku
  async _getSkus (id) {
    let skus = null
    const result = await Promise.promisify(request)(
      'http://s5.a.dx2rd.com:3000/v1/articlesku/' + id
    )
    let { data } = JSON.parse(result.body)
    skus = data[Utils.toLongId(id)]
    return skus
  }
  async genShareData (id, trueM) {
    const ret = Object.create(null)
    const titles = await metaTable.getTitles(id)
    const coverex = Utils.getFirst(await imageTable.getThumbImagesUrl(id))
    ret.url = `https://c.diaox2.com/view/app/?m=${trueM}&id=${id}`
    ret.image = coverex
    return Object.assign(ret, titles)
  }
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到ctype，然后在路由到取相应数据的方法
   */
  async getZKAndZTAndArticleData (id) {
    console.log('getZKAndZTAndArticleData exec ....')
    const ctype = await metaTable.getCtypeById(id)
    const trueM = Utils.ctypeToM(ctype)
    // console.log('trueM:', trueM)
    let data = null
    // console.log('trueM:', trueM)
    const buylink = await metaService.getBuylink(id)
    // console.log('buylink:', buylink)
    switch (trueM) {
      case 'show': // 正文页渲染 firstpage/goodthing/activity/exprience
        data = await this.getArticleData(id, ctype)
        break
      case 'zk': // 专刊页渲染
        data = await this.getZKData(id, ctype)
        break
      case 'zt': // 专刊页渲染
        data = await this.getZTData(id, ctype)
        break
    }
    data.has_buy_link = false
    if (buylink) {
      data.buylink = buylink
      data.has_buy_link = true
    }
    data.skus = await this._getSkus(id)
    // console.log('data.skus:', data.skus)
    data.share_data = await this.genShareData(id, trueM)
    // console.log(data)
    return data
  }
  getReadcound (aids) {
    if (!Utils.isValidArray(aids)) return {}
    aids = Utils.toLongId(aids)
    return new Promise((resolve, reject) => {
      request(
        {
          url: 'http://api.diaox2.com/v1/stat/all',
          method: 'POST',
          json: true,
          headers: { 'content-type': 'application/json' },
          body: { aids }
        },
        (error, response, body) => {
          if (error) reject(error)
          if (response.statusCode === 200) {
            const {res} = body
            const keys = Object.keys(res)
            const ret = Object.create(null)
            keys.forEach(key => {
              ret[key] = res[key].click
            })
            console.log('ret:', ret)
            resolve(ret)
          } else {
            reject('接口返回错误的状态吗', response.statusCode)
          }
        }
      )
    })
  }
  /**
   * @param {string} src
   * @memberof Show
   * 根据source拿到作者页的渲染数据
   */
  async getAuthorData (src) {
    let data = await authorService.setSource(src).getRenderData()
    let ret = Object.create(null)
    // source: "ZRJ",
    // title: "开山怪",
    // intro: "猎天下奇，会天下友，扯三句淡，粗两句口。迷失在：脑洞 + 节操 = 定值　的天赋树方程里。",
    // type: "author",
    // pic_uri: "//c.diaox2.com/cms/diaodiao/people/zrj.jpg",
    // link: "www.diaox2.com",
    // naming: "调调编辑",
    // value: "不约",
    // brief: "怪蜀黍"
    ret.author = {
      header_image: data.author.pic_uri,
      name: data.author.title,
      introduction: data.author.intro,
      sub_text: data.author.value
    }
    const {metas} = data
    if (!Utils.isValidArray(metas)) return
    const aids = metas.slice(0, 20).map(meta => meta.nid)
    const readCounts = await this.getReadcound(aids)
    console.log('readCounts:', readCounts)
    ret.article = []
    for (let meta of data.metas) {
      ret.article.push({
        title: meta.title.join(),
        read_cound: readCounts[Utils.toLongId(meta.nid)] || 0,
        image: meta.thumb_image_url,
        article_id: meta.nid,
        ctype: meta.ctype
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
    let data = await tagService
      .setTid(tid)
      .getRenderData(true, true, false, true)
    let ret = Object.create(null)
    ret.name = data.name
    ret.article = []
    const findImageById = (id, images) => {
      for (let img of images) {
        if (img.aid === id) {
          return img.url
        }
      }
    }
    const {metas} = data
    const aids = metas.slice(0, 20).map(meta => meta.id)
    const readCounts = await this.getReadcound(aids)
    for (let meta of metas) {
      ret.article.push({
        title: meta.title,
        read_cound: readCounts[Utils.toLongId(meta.id)] || 0,
        image: findImageById(meta.id, data.images),
        article_id: meta.id,
        ctype: meta.ctype
      })
    }
    return ret
  }
  /**
   * @memberof Show
   * 对外暴露的接口，根据在 router.js 中所set的type的不同，路由到相应的取数据的方法
   */
  getData (param) {
    const { type } = this
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

// const show = new Show()
// show.getReadcound([42189463758431, 23484881179996, 23021024711920, 42262478202480]).then(data => {
//   console.log(data)
// })

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
