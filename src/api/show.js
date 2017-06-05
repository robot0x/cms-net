// const DB = require('../db/DB')
const MetaTable = require('../db/MetaTable')
const metaTable = new MetaTable()
const ImageTable = require('../db/ImageTable')
const imageTable = new ImageTable()
const Parser = require('../render/mobile/show/parser')
const imageHandler = require('../render/mobile/show/imageHandler')
const skuHandler = require('../render/mobile/show/skuHandler')
const parser = new Parser()
const Log = require('../utils/Log')
const Utils = require('../utils/Utils')
// const DB = require('../db/DB')
const ContentTable = require('../db/ContentTable')
const contentTable = new ContentTable()
const BuyinfoTable = require('../db/BuyinfoTable')
const buyinfoTable = new BuyinfoTable()
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
  // findSkuBySid (skus, sid) {
  //   for (let sku of skus) {
  //     if (sku.sid == sid) {
  //       return sku
  //     }
  //   }
  // }
  // async getSkusBySids (sids) {
  //   console.log('sids:', sids)
  //   return new Promise((resolve, reject) => {
  //     request(
  //       {
  //         url: 'http://s5.a.dx2rd.com:3000/v1/getsimplesku/',
  //         method: 'POST',
  //         json: true,
  //         headers: { 'content-type': 'application/json' },
  //         body: { sids }
  //       },
  //       (error, response, body) => {
  //         if (error) reject(error)
  //         if (response.statusCode === 200) {
  //           console.log('skus:', JSON.stringify(body.data))
  //           resolve(body.data)
  //         } else {
  //           reject('接口返回错误的状态吗', response.statusCode)
  //         }
  //       }
  //     )
  //   })
  // }
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到firstpage/goodthing/activity/exprience类型的渲染数据
   */
  async getArticleData (id, ctype) {
    console.log('[API show getArticleData] 输入参数为：', id)
    try {
      let [content, meta, images, goods] = await Promise.all([
        contentTable.getById(id),
        metaService.getRawMetas(id, false, true, false, false, true),
        imageTable.getByAid(id),
        recommend(id)
      ])
      // (useBuylink = true, isShortId = false, useCoverex = false, useBanner = false, useSwipe = false , useImageSize = false)
      let { swipe_image_url, title, price, author } = meta
      parser.markdown = content
      let html = parser.getHTML()
      // 批处理文章内引用的图片，根据image表中的记录，给img标签赋值（width\height\alt等）
      html = imageHandler(html, images, false)
      // 批处理文章内引用的sku，根据sid通过getsimplesku接口拿数据，然后更新与sku相关的标签
      html = await skuHandler(html, false)
      parser.html = html
      let contents = parser.getData()
      if (goods) {
        goods = goods.map(good => {
          // console.log(good.type)
          return {
            image: good.thumb,
            title: good.title,
            ctype: Utils.typeToCtype(good.type),
            article_id: Utils.toShortId(good.serverid)
          }
        })
      } else {
        goods = []
      }
      return {
        ctype,
        header: {
          title: Utils.getFirst(title),
          price: { type: 'price', value: price },
          banners: swipe_image_url,
          author: { url: author.pic, value: author.name }
        },
        contents,
        goods
      }
    } catch (e) {
      console.log(e)
      Log.exception(e)
      return null
    }
  }
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到专刊类型的渲染数据
   */
  async getZKData (id, ctype) {
    Log.business('[API show showZK] 输入参数为：', id)
    const ret = Object.create(null)
    try {
      let [markdown, meta] = await Promise.all([
        contentTable.getById(id),
        metaService.getRawMetas(id)
      ])
      if (!markdown) return null
      let data = Utils.getZkDataByParseMarkdown(markdown)
      let title = meta.title[0]
      let image = meta.cover_image_url
      let desc = data.zkdesc
      ret.title = title
      ret.desc = desc
      ret.image = image
      let cids = data.ids
      let rawMetas = await metaService.getRawMetas(cids, true, true)
      let metas = []
      for (let cid of cids) {
        let card = Object.create(null)
        cid = Number(cid)
        card.id = cid
        let cardMeta = Utils.getFirst(
          rawMetas.filter(rawMeta => rawMeta.nid === cid)
        )
        if (!cardMeta) continue
        card.title = cardMeta.title[0]
        card.desc = data.article[cid]
        card.image = cardMeta.cover_image_url
        card.buylink = cardMeta.buylink
        metas.push(card)
      }
      ret.ctype = meta.ctype
      ret.metas = metas
    } catch (error) {
      Log.exception(error)
      console.log(error)
    }
    return ret
  }
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到专题类型的渲染数据
   */
  async getZTData (id, ctype) {
    // Log.business('[API show showZT] 输入参数为：', id)
    console.log('[API show showZT] 输入参数为：', id)
    const ret = Object.create(null)
    try {
      let [markdown, meta] = await Promise.all([
        contentTable.getById(id),
        metaService.getRawMetas(id)
      ])
      if (!markdown) return null
      let data = Utils.getZtDataByParseMarkdown(markdown)
      let title = meta.title[0]
      let image = meta.cover_image_url
      let desc = data.ztdesc
      ret.title = title
      ret.desc = desc
      ret.image = image
      let cids = data.ids
      console.log(cids)
      let rawMetas = await metaService.getRawMetas(cids, true, true)
      let metas = []
      for (let cid of cids) {
        let card = Object.create(null)
        card.id = cid
        let cardMeta = Utils.getFirst(
          rawMetas.filter(rawMeta => rawMeta.nid === cid)
        )
        if (!cardMeta) continue
        card.title = cardMeta.title[0]
        card.desc = data.article[cid]
        card.image = cardMeta.cover_image_url
        metas.push(card)
      }
      ret.ctype = meta.ctype
      ret.metas = metas
    } catch (error) {
      Log.exception(error)
      console.log(error)
    }
    return ret
  }
  // async getZKData (id, ctype) {
  //   Log.business('[API show showZK] 输入参数为：', id)
  //   const markdown = await contentTable.getById(id)
  //   if (!markdown) return null
  //   const allCardReg = /```card[\s\S]+?```/ig
  //   const zkReg = /```zk[\s\S]+?```/ig
  //   const allCardMarkdown = markdown.match(allCardReg)
  //   let zkMarkdown = markdown.match(zkReg)
  //   if (!Utils.isValidArray(zkMarkdown)) return null
  //   zkMarkdown = Utils.getFirst(zkMarkdown)
  //   console.log(zkMarkdown)
  //   const idReg = /id[:：]\s*(\d+)\s*title[:：]/
  //   const titleReg = /title[:：]\s*(.+)\s*desc[:：]/
  //   const descReg = /desc[:：]\s*(.+)\s*image[:：]/
  //   const imageReg = /image[:：]\s*!\[.*\]\((?:https?)?(?:\/\/)?(.+)\s*\)\s*/
  //   let title = zkMarkdown.match(titleReg)
  //   let desc = zkMarkdown.match(descReg)
  //   let image = zkMarkdown.match(imageReg)
  //   if (Utils.isValidArray(title)) {
  //     title = title[1]
  //   }
  //   if (Utils.isValidArray(desc)) {
  //     desc = desc[1]
  //   }
  //   if (Utils.isValidArray(image)) {
  //     image = image[1]
  //   }
  //   const ret = Object.create(null)
  //   ret.title = title
  //   ret.desc = desc
  //   ret.image = image
  //   let metas = []
  //   for (let cardMarkdown of allCardMarkdown) {
  //     let card = Object.create(null)
  //     let cardId = cardMarkdown.match(idReg)
  //     let cardTitle = cardMarkdown.match(titleReg)
  //     let cardDesc = cardMarkdown.match(descReg)
  //     let cardImage = cardMarkdown.match(imageReg)
  //     if (Utils.isValidArray(cardId)) {
  //       cardId = cardId[1]
  //     }
  //     if (Utils.isValidArray(cardTitle)) {
  //       cardTitle = cardTitle[1]
  //     }
  //     if (Utils.isValidArray(cardDesc)) {
  //       cardDesc = cardDesc[1]
  //     }
  //     if (Utils.isValidArray(cardImage)) {
  //       cardImage = cardImage[1]
  //     }
  //     card.id = Number(cardId)
  //     card.title = cardTitle
  //     card.desc = cardDesc
  //     card.image = cardImage
  //     card.buylink = await metaService.getBuylink(cardId)
  //     metas.push(card)
  //   }
  //   ret.ctype = ctype
  //   ret.metas = metas
  //   return ret
  // }

  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到专题类型的渲染数据
   */
  // async getZTData (id, ctype) {
  //   Log.business('[API show showZK] 输入参数为：', id)
  //   const ret = Object.create(null)
  //   try {
  //     const markdown = await contentTable.getById(id)
  //     if (!markdown) return null
  //     const allCardReg = /```card[\s\S]+?```/ig
  //     const ztReg = /```zt[\s\S]+?```/ig
  //     console.log(markdown)
  //     const allCardMarkdown = markdown.match(allCardReg)
  //     let ztMarkdown = markdown.match(ztReg)
  //     if (!Utils.isValidArray(ztMarkdown)) return null
  //     ztMarkdown = Utils.getFirst(ztMarkdown)
  //     const idReg = /id[:：]\s*(\d+)\s*title[:：]/
  //     const titleReg = /title[:：]\s*(.+)\s*desc[:：]/
  //     const descReg = /desc[:：]\s*(.+)\s*image[:：]/
  //     const imageReg = /image[:：]\s*!\[.*\]\((?:https?)?(?:\/\/)?(.+)\s*\)\s*/
  //     let title = ztMarkdown.match(titleReg)
  //     let desc = ztMarkdown.match(descReg)
  //     if (Utils.isValidArray(title)) {
  //       title = title[1]
  //     }
  //     if (Utils.isValidArray(desc)) {
  //       desc = desc[1]
  //     }
  //     ret.title = title
  //     ret.desc = desc || ''
  //     let metas = []
  //     for (let cardMarkdown of allCardMarkdown) {
  //       let card = Object.create(null)
  //       let cardId = cardMarkdown.match(idReg)
  //       let cardTitle = cardMarkdown.match(titleReg)
  //       let cardDesc = cardMarkdown.match(descReg)
  //       let cardImage = cardMarkdown.match(imageReg)
  //       if (Utils.isValidArray(cardId)) {
  //         cardId = cardId[1]
  //       }
  //       if (Utils.isValidArray(cardTitle)) {
  //         cardTitle = cardTitle[1]
  //       }
  //       if (Utils.isValidArray(cardDesc)) {
  //         cardDesc = cardDesc[1]
  //       }
  //       if (Utils.isValidArray(cardImage)) {
  //         cardImage = cardImage[1]
  //       }
  //       card.id = Number(cardId)
  //       card.title = cardTitle
  //       card.desc = cardDesc
  //       card.image = cardImage
  //       metas.push(card)
  //     }
  //     ret.metas = metas
  //     ret.ctype = ctype
  //   } catch (error) {
  //     console.log(error)
  //   }
  //   return ret
  // }

  // 拿出文章关联的所有sku
  async _getSkus (id) {
    let skus = null
    const result = await Promise.promisify(request)(
      'http://s5.a.dx2rd.com:3000/v1/articlesku/' + id
    )
    let { data } = JSON.parse(result.body)
    skus = data[Utils.toLongId(id)]
    return skus || []
  }
  async genShareData (id, trueM) {
    const ret = Object.create(null)
    let [titles, coverex] = await Promise.all([
      metaTable.getTitles(id),
      imageTable.getThumbImagesUrl(id)
    ])
    // const titles = await metaTable.getTitles(id)
    coverex = Utils.getFirst(coverex)
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
    try {
      console.log('getZKAndZTAndArticleData exec ....', id)
      const ctype = await metaTable.getCtypeById(id)
      const trueM = Utils.ctypeToM(ctype)
      console.log('trueM:', trueM)
      // let data = null
      let promises = []
      // console.log('trueM:', trueM)
      // const buylink = await metaService.getBuylink(id)
      // console.log('buylink:', buylink)
      switch (trueM) {
        case 'show': // 正文页渲染 firstpage/goodthing/activity/exprience
          promises.push(this.getArticleData(id, ctype))
          // data = await this.getArticleData(id, ctype)
          break
        case 'zk': // 专刊页渲染
          promises.push(this.getZKData(id, ctype))
          break
        case 'zt': // 专刊页渲染
          promises.push(this.getZTData(id, ctype))
          // data = await this.getZTData(id, ctype)
          break
      }
      // data.has_buy_link = false
      // if (buylink) {
      //   data.buylink = buylink
      //   data.has_buy_link = true
      // }
      promises.push(this._getSkus(id))
      promises.push(this.genShareData(id, trueM))
      let [data, skus, shareData] = await Promise.all(promises)
      /**
     * show_part: [
            {
                "channel": "淘宝",
                "buy_link": "www.baidu.com",
                "des": "软边白板已下架，此链接为铝边白板的链接",
                "price": 233,
                "id": 123,//skuID用于4.0需求sku失效用户可以进行反馈
                "type":"link"//用于判断跳转类型 3x版本都为link
            }
        ],
         pick_up_part: [
            {
                "channel": "淘宝",
                "buy_link": "www.baidu.com",
                "des": "软边白板已下架，此链接为铝边白板的链接",
                "price": 233,
                "id": 123,
                "type":"link"
            }
         ]
      在电商上线之前，pick_up_part 没有值
      如果sku有且仅有一条数据，则把sales数组变形成上述show_part形式
      否则的话，则从diaodiao_buylink表拿数据，把拿到的多条数据变形成show_part形式
      电商上线之后，show_part是我们自己的电商连接，pick_up_part是除了我们自己之外的其他链接
     */
      data.sku = Object.create(null)
      data.sku.pick_up_part = []
      if (skus && skus.length === 1) {
        let sku = Utils.getFirst(skus)
        let { sid, sales } = sku
        try {
          data.sku.show_part = await this._toShowpart(JSON.parse(sales), sid, 'sku')
        } catch (error) {
          data.sku.show_part = []
        }
      } else {
        const sales = await buyinfoTable.getByAid(id)
        data.sku.show_part = await this._toShowpart(sales, null, 'buyinfo')
      }
      // data.skus = await this._getSkus(id)
      // data.skus = skus.map(sku => {
      //   try {
      //     sku.images = JSON.parse(sku.images)
      //     sku.tags = JSON.parse(sku.tags)
      //     sku.sales = JSON.parse(sku.sales)
      //     sku.revarticles = JSON.parse(sku.revarticles)
      //     return sku
      //   } catch (error) {
      //     return sku
      //   }
      // })
      data.share_data = shareData
      return data
    } catch (error) {
      console.log(error)
      Log.exception(error)
      return null
    }
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
            const { res } = body
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
   *
   *
   * @param {any} sales
   * @param {any} type
   *
   * @memberof Show
  "channel": "淘宝",
  "buy_link": "www.baidu.com",
  "des": "软边白板已下架，此链接为铝边白板的链接",
  "price": 233,
  "id": 123,//skuID用于4.0需求sku失效用户可以进行反馈
  "type":"link"//用于判断跳转类型 3x版本都为link
  */
  _toShowpart (sales, id, type) {
    let showpart = []
    for (let sale of sales) {
      console.log('_toShowpart sale:', sale)
      let ele = Object.create(null)
      ele.tag = type
      ele.type = 'link'
      ele.channel = sale.mart
      ele.des = sale.intro
      ele.price = sale.price
      ele.buy_link =
        sale.link_m_cps ||
        sale.link_pc_cps ||
        sale.link_m_raw ||
        sale.link_pc_raw
      if (id) {
        ele.id = id
      }
      if (type === 'buyinfo') {
        ele.buy_link = sale.link || sale.link_pc
        ele.id = sale.buy_id
      }
      showpart.push(ele)
    }
    return showpart
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
    const { metas } = data
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
    const { metas } = data
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
