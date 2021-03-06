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
const SKU = require('../utils/SKU')
const ContentTable = require('../db/ContentTable')
const contentTable = new ContentTable()
const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const AuthorService = require('../service/AuthorService')
const authorService = new AuthorService()
const TagService = require('../service/TagService')
const tagService = new TagService()
const request = require('request')
const Promise = require('bluebird')
class Show {
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到firstpage/goodthing/activity/exprience类型的渲染数据
   */
  async getArticleData (id, ctype) {
    try {
      // let [content, meta, images, goods] = await Promise.all([
      let [content, meta, images] = await Promise.all([
        contentTable.getById(id),
        metaService.getRawMetas(
          id,
          false,
          true,
          false,
          false,
          true,
          false,
          true
        ),
        imageTable.getByAid(id)
        // ,recommend(id, null, true)
      ])
      // (useBuylink = true, isShortId = false, useCoverex = false, useBanner = false, useSwipe = false , useImageSize = false)
      let { swipe_image_url, title, price, author, timetopublish } = meta
      // console.log('[getArticleData] meta:', meta)
      parser.markdown = content
      let html = parser.getHTML()
      // 批处理文章内引用的图片，根据image表中的记录，给img标签赋值（width\height\alt等）
      html = imageHandler(html, images, false)
      // 批处理文章内引用的sku，根据sid通过getsimplesku接口拿数据，然后更新与sku相关的标签
      html = await skuHandler(html, false, true)
      parser.html = html
      let contents = parser.getData()
      // if (goods) {
      //   let shouldGetStatCids = []
      //   goods = goods.map(good => {
      //     // 如果猜你喜欢中有price就下发price，否则，下发收藏数
      //     let {cover, title, type, serverid, price} = good
      //     let article_id = Utils.toShortId(serverid) // eslint-disable-line
      //     let newGood = {
      //       // image: good.thumb,
      //       image: cover,
      //       title: title,
      //       ctype: Utils.typeToCtype(type),
      //       article_id
      //     }
      //     if (price && price.trim() && !/N\/A/i.test(price)) {
      //       newGood.price = price
      //     } else {
      //       shouldGetStatCids.push(serverid)
      //     }
      //     return newGood
      //   })
      //   if (Utils.isValidArray(shouldGetStatCids)) {
      //     let stat = await this.getStat(shouldGetStatCids)
      //     goods = goods.map(good => {
      //       let serverid = Utils.toLongId(good.article_id)
      //       if (shouldGetStatCids.indexOf(serverid) === -1) return good
      //       good.favo_count = (stat[serverid] || Object.create(null)).fav || 0
      //       return good
      //     })
      //   }
      // } else {
      //   goods = []
      // }
      return {
        ctype,
        header: {
          title: Utils.getFirst(title),
          pubtime: timetopublish,
          price: { type: 'price', value: price },
          banners: swipe_image_url,
          author: { url: author.pic, value: author.name, source: author.source }
        },
        contents
        // ,goods
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
      let [rawMetas, stat, skuData] = await Promise.all([
        // ids = [this.id],
        // useBuylink = true,
        // isShortId = false,
        // useCoverex = true,
        // useBanner = false,
        // useSwipe = false,
        // useImageSize = false,
        // useAuthorSource = false,
        // useTag = false
        metaService.getRawMetas(
          cids,
          true, // useBuylink
          true, // isShortId
          true, // useCoverex
          false, // useBanner
          false, // useSwipe
          true // useImageSize
        ),
        this.getStat(cids),
        SKU.getSkusByArticleIds(cids, true)
      ])
      let metas = []
      let empty = Object.create(null)
      // console.log('rawMetas:', rawMetas)
      for (let cid of cids) {
        let card = Object.create(null)
        cid = Number(cid)
        card.id = cid
        let cardMeta = Utils.getFirst(
          rawMetas.filter(rawMeta => rawMeta.nid === cid)
        )
        if (!cardMeta) continue
        let {
          title,
          cover_image_url,
          coverex_image_url,
          buylink,
          ctype,
          price,
          coverwidth,
          coverheight,
          coverexwidth,
          coverexheight
        } = cardMeta
        card.title = title[0]
        card.desc = data.article[cid]
        card.image = cover_image_url; // eslint-disable-line
        card.buylink = buylink
        card.ctype = ctype
        card.image_w = coverwidth
        card.image_h = coverheight
        let st = stat[Utils.toLongId(cid)] || empty
        // 当不是好物时，不下发ctype字段
        if (ctype === 2) {
          card.price = price
        }
        // 渲染策略：如果是首页，取coverex作为渲染的图，其他的都是取cover
        if (ctype === 1) {
          card.image = coverex_image_url; // eslint-disable-line
          card.image_w = coverexwidth
          card.image_h = coverexheight
        }
        card.favo_count = st.fav || 0
        // 处理sku
        let skus = skuData[cid] || []
        card.skus = []
        for (let sku of skus) {
          let newSku = {
            sid: sku.sid,
            title: sku.title,
            image: ((sku.images || [])[0] || {}).url || '',
            price: sku.price_str || '',
            brand: sku.brand || '',
            // TODO: 将来我们电商上线之后，sku会有我们自己的商品（gid）或者我们自己的微店和淘宝链接
            // 这些需要放show_part里
            show_part: [],
            pick_up_part: []
          }
          let sales = Utils.skuDataConvert(sku.sales)
          for (let sale of sales) {
            let {type} = sale
            // 有调电商和精品购进入show_part，第三方进入pick_up_part
            if (/youdiao|shop_go/i.test(type)) {
              newSku.show_part.push(sale)
            } else {
              newSku.pick_up_part.push(sale)
            }
          }
          card.skus.push(newSku)
        }
        /**
         * 20170718李园宁说，现在已经做了多sku的展示，就不需要老的购买页数据了
         */
        // const sales = (await buyinfoTable.getByAid(cid)) || []
        // for (let sale of sales) {
        //   card.sales.pick_up_part.push({
        //     type: 'buy',
        //     data: Utils.skuDataConvert(sale)
        //   })
        // }
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
    const ret = Object.create(null)
    try {
      let [markdown, meta] = await Promise.all([
        contentTable.getById(id),
        // 专题没有timetopublish，所以不需要setDebug
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
  // // 拿出文章关联的所有sku
  // async _getSkus (id) {
  //   let skus = null
  //   const result = await Promise.promisify(request)(
  //     'http://s5.a.dx2rd.com:3000/v1/articlesku/' + id
  //   )
  //   let { data } = JSON.parse(result.body)
  //   skus = data[Utils.toLongId(id)]
  //   return skus || []
  // }
  /**
   * 分享数据
   *
   * @param {number} id
   * @param {boolean} trueM
   * @returns
   * @memberof Show
   * http://content.image.alimmdn.com/cms/sites/default/files/20170530/goodthing/188QZZ.jpg
   * 如果取thumb图的话，太小了，客户端使用微博sdk分享之后，微博的sdk会再次压缩一次图片，导致图片
   * 变的很模糊，所以使用一张较大的图片，使用cover图，老的分享数据就是cover的
   */
  async genShareData (id, trueM) {
    const ret = Object.create(null)
    let [titles, cover] = await Promise.all([
      metaTable.getTitles(id),
      imageTable.getCoverImagesUrl(id)
    ])
    // const titles = await metaTable.getTitles(id)
    cover = Utils.getFirst(cover)
    // ret.url = `https://c.diaox2.com/view/app/?m=${trueM}&id=${id}`
    ret.url = `https://c.diaox2.com/share/${Utils.toLongId(id)}.html`
    ret.image = cover
    return Object.assign(ret, titles)
  }
  /**
   * @param {number} id
   * @memberof Show
   * 根据id拿到ctype，然后在路由到取相应数据的方法
   */
  async getZKAndZTAndArticleData (id) {
    try {
      const ctype = await metaTable.getCtypeById(id)
      const trueM = Utils.ctypeToM(ctype)
      let promises = []
      switch (trueM) {
        case 'show': // 正文页渲染 firstpage/goodthing/activity/exprience
          promises.push(this.getArticleData(id, ctype))
          break
        case 'zk': // 专刊页渲染
          promises.push(this.getZKData(id, ctype))
          break
        case 'zt': // 专刊页渲染
          promises.push(this.getZTData(id, ctype))
          break
      }
      let data, skus, shareData
      promises.push(this.genShareData(id, trueM))
      // 只有正文页才需要调用 articlesku 接口拿sku
      if (trueM === 'show') {
        promises.push(SKU.getSkusByArticleId(id));
        [data, shareData, skus] = await Promise.all(promises)
      } else {
        [data, shareData] = await Promise.all(promises)
      }
      data = data || {}
      skus = skus || []
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
      在电商上线之前，show_part 没有值
      如果sku有且仅有一条数据，则把sales数组变形成上述show_part形式
      否则的话，则从diaodiao_buylink表拿数据，把拿到的多条数据变形成show_part形式
      电商上线之后，show_part是我们自己的电商连接，pick_up_part是除了我们自己之外的其他链接
     */
      data.skus = []
      // data.sku.show_part = []
      // data.sku.pick_up_part = []
      for (let sku of skus) {
        let newSku = {
          sid: sku.sid,
          image: ((sku.images || [])[0] || {}).url || '',
          title: sku.title,
          show_part: [],
          price: sku.price_str || '',
          brand: sku.brand || '',
          pick_up_part: []
        }
        let sales = Utils.skuDataConvert(sku.sales)
        for (let sale of sales) {
          let {type} = sale
          // 有调电商和精品购进入show_part，第三方进入pick_up_part
          if (/youdiao|shop_go/i.test(type)) {
            newSku.show_part.push(sale)
          } else {
            newSku.pick_up_part.push(sale)
          }
        }
        data.skus.push(newSku)
      }
      /**
       * 20170718李园宁说，现在已经做了多sku的展示，就需要老的购买页数据了
       */
      // const sales = (await buyinfoTable.getByAid(id)) || []
      // for (let sale of sales) {
      //   data.sku.pick_up_part.push({
      //     type: 'buy',
      //     data: Utils.skuDataConvert(sale, 'buy')
      //   })
      // }
      data.share_data = shareData || {}
      return data
    } catch (error) {
      console.log(error)
      Log.exception(error)
      return null
    }
  }
  getStat (aids) {
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
            resolve(body.res)
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
    const { metas } = data
    if (!Utils.isValidArray(metas)) return
    const aids = metas.slice(0, 20).map(meta => meta.nid)
    const stat = await this.getStat(aids)
    ret.article = []
    const empty = Object.create(null)
    for (let meta of data.metas) {
      let st = stat[Utils.toLongId(meta.nid)] || empty
      ret.article.push({
        title: meta.title.join(),
        read_cound: st.click || 0,
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
    let data = await tagService.getRenderData(tid, true, true, false, true)
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
    const stat = await this.getStat(aids)
    const empty = Object.create(null)
    for (let meta of metas) {
      let st = stat[Utils.toLongId(meta.id)] || empty
      ret.article.push({
        title: meta.title,
        read_cound: st.click || 0,
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
  getData (param, type) {
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
// show.getStat([42189463758431, 23484881179996, 23021024711920, 42262478202480]).then(data => {
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
