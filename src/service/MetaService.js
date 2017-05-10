/**
 * Meta信息包括：
 *   1. article_meta内所有的字段
 *   2. author信息
 *   3. 图片信息，包括：cover/coverex/swipe/banner图
 */
const MetaTable = require('../db/MetaTable')
const ContentTable = require('../db/ContentTable')
const ImageTable = require('../db/ImageTable')
const AuthorTable = require('../db/AuthorTable')
const BuyinfoTable = require('../db/BuyinfoTable')
const DB = require('../db/DB')
const Utils = require('../utils/Utils')
const request = require('request')
const Promise = require('bluebird')
const moment = require('moment')


class MetaService {
  constructor (id) {
    this.metaTable = new MetaTable
    this.contentTable = new ContentTable
    this.imageTable = new ImageTable
    this.authorTable = new AuthorTable
    this.buyinfoTable = new BuyinfoTable
    this.setId(id)
  }

  setId (id) {
    this.id = id
  }
  /**
   * meta接口
   *
   *  "is_external": false,
      "title_color": 4294967295,
      "has_buylink": true,
      "title":["神奇的酒钥匙Clef du Vin: 一秒展现葡萄酒的陈年潜力"],
      "url": "http://c.diaox2.com/view/app/?m=show&id=2028",
      "price": "¥384起",
      "cid": 8710193678316,
      "ctype": 2,
      "tag": "",
      "latest_version": 60100,
      "cover_image_url": "http://a.diaox2.com/cms/sites/default/files/20160810/goodthing/jiuyaoshi.jpg",
      "buylink": "http://c.diaox2.com/view/app/sku/8710193678316/501.html",
      "nid": "2028",
      "author":{"pic": "people/Iris.jpg", "name": "小莫"},
      "thumb_image_url": "http://a.diaox2.com/cms/sites/default/files/20150520/goodthing/13591067658Cfg3MWV (1).jpg"
   */


  _findImageByAidAndType (aid, type, images) {
    let isSwipe = type === 16
    let ret = null
    if(isSwipe) {
      ret = []
      for(let image of images){
        if(image.aid == aid && image.type == type){
          ret.push(image)
        }
      }
    } else {
      for(let image of images){
        if(image.aid == aid && image.type == type){
          ret = image
          break
        }
      }
    }
    return ret
  }
  /**
   * ids: [7880, 8090, 9225, ...]  cid list 支持长短id 或者 一个id
   * isShortId: 内部使用，如果明确知道是短id，就不用进行id处理，
   * 若是外部调用，则一律进行处理
   * 如果ids的长度为100，使用buylink，则执行的sql总条数为：102条
   * 同样条件下，getRawMeta则需要执行 400 条sql
   * sql条数相差大约4倍
   *
   * 在我本机经过测试，取445条meta，发现：
   * getRawMetas 平均执行时间为 3450 ms
   * getRawMeta  平均执行时间为 13200 ms
   * 执行时间也相差大约4倍
   *
   * 取30条的话，
   * getRawMetas 平均执行时间为 270 ms
   * getRawMeta  平均执行时间为 380 ms
   *
   * 专题由于没有timetopublish字段，所有，专题没有meta
   */
  async getRawMetas (
    ids = [this.id],
    useBuylink = true,
    isShortId = false,
    useCoverex = false,
    useBanner = false,
    useSwipe = false ,
    useImageSize = false
  ) {
    // 参数处理
    if(!Utils.isValidArray(ids)){
      // 如果只传入一个id，则转化为数组，否则，参数不合法，直接返回
      if(/^\d+$/.test(ids)){
         ids = [ids]
      } else {
        return null
      }
    }
    // 内部使用这个参数，稍微提升点儿性能
    if(!isShortId) {
      ids = Utils.toShortId(ids)
    }
    // console.log('ids:', ids)
    // const metaAndAuthors = await DB.exec(`SELECT meta.id AS nid, meta.title, meta.titleex, meta.titlecolor, meta.ctype, meta.price, meta.buylink, meta.author, au.pic_uri, au.title AS author_name FROM diaodiao_article_meta AS meta ,diaodiao_author AS au where meta.author = au.source AND meta.id in (${ids.join(',')})`)
    // 取meta需要加上时间限制，timetopublish必须处在20141108和今天之间
    const sql = `SELECT meta.id AS nid, meta.title, meta.titleex, meta.titlecolor, meta.ctype, meta.price, meta.buylink, meta.timetopublish, au.pic_uri, au.title AS author_name FROM article_meta AS meta ,diaodiao_author AS au WHERE meta.id in (${ids.join(',')}) AND meta.author = au.source AND meta.timetopublish BETWEEN 20141108 AND ${Number(moment().add(1, 'days').format('YYYYMMDD'))}`
    // const sql = `SELECT meta.id AS nid, meta.title, meta.titleex, meta.titlecolor, meta.ctype, meta.price, meta.buylink, meta.author, au.pic_uri, au.title AS author_name FROM diaodiao_article_meta AS meta LEFT JOIN author AS au ON meta.author = au.source`
    // const sql = `SELECT meta.id AS nid, meta.title, meta.titleex, meta.titlecolor, meta.ctype, meta.price, meta.buylink, meta.author, au.pic_uri, au.title AS author_name FROM article_meta AS meta LEFT JOIN diaodiao_author AS au ON meta.id in (${ids.join(',')}) and meta.author = au.source`
    // console.log(sql)
    try {
      const metaAndAuthors = await DB.exec(sql)
      console.log('metaAndAuthors:', metaAndAuthors);
      // console.log('[MetaService.getRawMetas]:', metaAndAuthors)
      // type = 2为cover图，type = 8 为thumb图, type = 4 coverex图
      let imageCols = ['aid', "CONCAT('//', url) AS url", 'type']

      if(useImageSize){
        imageCols.push('width')
        imageCols.push('height')
      }

      let imageTypes = [2, 8]

      if (useCoverex) {
        imageTypes.push(4)
      }

      if (useSwipe) {
        imageTypes.push(16)
      }

      if (useBanner) {
        imageTypes.push(32)
      }

      const images = await this.imageTable.getSpecialImagesUrl(ids, imageTypes, imageCols)
      const metas = []
      for (let me of metaAndAuthors) {
        let {nid, title, titleex, titlecolor, ctype, price, pic_uri, author_name, timetopublish} = me
        // console.log('getRawMetas:', me);
        title = titleex? [title, titleex || ''] : [title || ''] // 防止出现[null]的情况，这种情况应该转换为空数组，即[]
        let meta = Object.create(null) // 使用超轻量对象，提升性能
        meta.timetopublish = timetopublish
        // author字段变形
        meta.author = { pic: pic_uri, name: author_name }
        // 这个可能在app内用来控制title的颜色
        meta.title_color = meta.titlecolor || 4294967295
        meta.title = title
        meta.price = price || 'N/A'
        meta.ctype = ctype
        meta.type = Utils.ctypeToType(ctype)
        // is_external是否是外部文章，现在几乎没有了，所以默认为false
        meta.is_external = false
        let cover_image = this._findImageByAidAndType(nid, 2, images) || {}
        let thumb_image = this._findImageByAidAndType(nid, 8, images) || {}

        meta.cover_image_url = cover_image.url || ''
        meta.thumb_image_url = thumb_image.url || ''

        let coverex_image = null
        let banner_image = null
        let swipe_images = null // 走马灯图，可能有多个

        if(useCoverex) {
          coverex_image = this._findImageByAidAndType(nid, 4, images) || {}
          if(coverex_image){
            meta.coverex_image_url = coverex_image.url
          }
        }

        if(useSwipe) {
          swipe_images = this._findImageByAidAndType(nid, 16, images) || {}
          if ( Utils.isValidArray(swipe_images) ) {
            meta.swipe_image_url = swipe_images.map(swipe => swipe.url)
          }
        }

        if(useBanner) {
          banner_image = this._findImageByAidAndType(nid, 32, images) || {}
          if(banner_image){
            meta.banner_image_url = banner_image.url
          }
        }

        if(useImageSize){
          meta.coverwidth = cover_image.width || 0
          meta.coverheight = cover_image.height || 0
          meta.thumbwidth = thumb_image.width || 0
          meta.thumbheight = thumb_image.height || 0

          if (useCoverex && coverex_image) {
            meta.coverexwidth = coverex_image.width || 0
            meta.coverexheight = coverex_image.height || 0
          }

          if (useBanner && banner_image) {
            meta.bannerwidth = banner_image.width || 0
            meta.bannerheight = banner_image.height || 0
          }
        }

        meta.nid = nid
        // buylink处理
        // 对于tag页、author页等页面渲染，或只需拿到简单的meta（比如只需要title,cover_image_url），
        // 所以我们就没有必要处理buylink，处理buylink很耗费性能。
        if (useBuylink){
          let buylink = await this.getBuylink(nid, meta.buylink)
          if(buylink){
            meta.has_buylink = true
            meta.buylink = buylink
          }else {
            meta.has_buylink = false
          }
        }
        metas.push(meta)
      }

      // 如果只传一个id，则返回 {}   形式
      // 如果传有多个id，则返回 [{}] 形式
      if(ids.length === 1 && metas.length === 1) {
        return Utils.getFirst(metas)
      } else {
        // console.log('getRawMetas:', metas)
        return metas.length > 0 ? metas : null
      }
    } catch (e) {
      console.log(e)
      return null
    }
  }

 /**
  * 一次性地通过aid，从article_meta/article_content/image/author 四张表中拿数据
  * 组装成对象，供meta接口和渲染接口使用
  * 渲染专刊时，要用buylink
  */
  // 渲染数据接口
  async getRenderData (id = this.id, useBuylink = false) {
    const {metaTable, contentTable, imageTable, authorTable} = this
    // async函数返回的就是promise，所以无需再包一promise
    // return new Promise(async (resolve, reject) => {
    let meta, images, content
    try {
      let meta = await metaTable.setColumns(['title','titleex', 'ctype', 'timetopublish', 'price', 'author']).getById(id)
      let {timetopublish} = meta
      if (timetopublish < 20141108 && timetopublish > Number(moment().format('YYYYMMDD'))) return
      // let images = await imageTable.getSpecialImagesUrl(id, [2, 8, 16], ['url', 'type', 'alt', 'title'])
      let images = await imageTable.setColumns(['url', 'type', 'alt', 'width', 'height']).getByAid(id)
      let content = await contentTable.getById(id)
      // console.log('author:', meta.author)
      // 由于author表目前的数据很少，所以写死
      // let author = await authorTable.getBySource(meta.author)
      let author = await authorTable.getBySource(meta.author)
      if(author){
        author.pic_uri = Utils.addUrlPrefix(author.pic_uri)
      }
      // 根据规则拿购买链接，把meta表中的购买链接作为第二个参数，这样在条件命中时，我们就能少访问一次数据库
      if (useBuylink){
        let buylink = await this.getBuylink(id, meta.buylink)
        if(buylink){
          meta.has_buylink = true
          meta.buylink = buylink
        } else {
          meta.has_buylink = false
        }
      }
      return { meta, images, content, author }
    } catch (e) {
      console.log(e)
      throw new Error(e)
    }
  }

  /**
   * 如果文章仅有1个sku，那么将这个sku的链接http://c.diaox2.com/view/app/sku/cid/sid.html，作为购买链接，has_buy_link = true，处理结束
     如果文章有0个或者多个sku，那么看文章有没有老的传统购买页，如果有，将http://c.diaox2.com/view/app/?m=buy&aid=nid，作为购买链接，has_buy_link = true，处理结束
     否则看看文章有没有填写cms.buylink字段，如果填写了，用这个。has_buy_link = true，处理结束
   */
  getBuylink (id, cms_buy_link = '') {
    if(!id) return;
    // console.log('getBuylink:', id)
    // 首先，http://s5.a.dx2rd.com:3000/v1/articlesku/1233 通过这个接口拿sku
    return new Promise((resolve, reject) => {
      request(`http://s5.a.dx2rd.com:3000/v1/articlesku/${id}`, async (err, body) => {
        if(err) {
          resolve(null)
        }
        try {
          const {state, data}  = JSON.parse(body.body)
          const skus = data[Utils.toLongId(id)]
          // 如果只有1个sku，则把SKU页作为购买页
          if(Utils.isValidArray(skus) && skus.length === 1){
            resolve(`http://c.diaox2.com/view/app/sku/${id}/${skus[0].sid}.html`)
          } else {
            // 若SKU有0个或多个，则从diaodiao_buyinfo取购买页
            // const buy_info = await this.metaTable.exec(`SELECT * FROM diaodiao_buyinfo where aid = ${id}`)
            const buy_info = await this.buyinfoTable.getByAid(id)
            // 如果diaodiao_buyinfo表存在购买信息
            if (buy_info.length > 0 && buy_info[0].link) {
              resolve(`http://c.diaox2.com/view/app/?m=buy&aid=${id}`)
            } else if (cms_buy_link) {
              resolve(cms_buy_link)
            } else {
              resolve(await this.metaTable.getBuylinkById(id))
            }
          }
        } catch (e) {
          console.log(e)
          resolve(null)
        }
      })
    })
  }
}

module.exports = MetaService


// async getRawMeta (id = this.id) {
//   try {
//     const {imageTable, metaTable, authorTable} = this
//     // const data = await this.fetchAll(id)
//     // [2, 8] type = 2 是cover图，type = 8 是thumb图
//     const images = await imageTable.getSpecialImagesUrl(id, [2, 8])
//     const meta = await metaTable
//                         .setColumns(['title', 'titleex', 'titlecolor', 'ctype', 'price', 'buylink', 'author'])
//                         .getById(id)
//     const author = await authorTable
//                         .setColumns(['pic_uri', 'title'])
//                         .getBySource(meta.source)
//     const mbuylink = await this.getBuylink(id, meta.buylink)
//     if (mbuylink) {
//       meta.has_buylink = true
//       meta.buylink = mbuylink
//     } else {
//       meta.has_buylink = false
//     }
//     let {title, titleex, titlecolor, ctype, price, buylink, has_buylink} = meta
//     let cover_image_url = images.filter(image => {
//       return (image.type & 2) === 2
//     })
//     let thumb_image_url = images.filter(image => {
//       return (image.type & 8) === 8
//     })
//     if(Utils.isValidArray(cover_image_url)){
//       cover_image_url = 'http://' + cover_image_url[0].url
//     }
//     if(Utils.isValidArray(thumb_image_url)){
//       thumb_image_url = 'http://' + thumb_image_url[0].url
//     }
//     title = titleex? [title, titleex] : [title]
//     return {
//       nid: id,
//       is_external: false,
//       title_color: titlecolor || 4294967295,
//       title,
//       price,
//       ctype,
//       has_buylink,
//       buylink,
//       author: { pic: author.pic_uri, name: author.title },
//       cover_image_url,
//       thumb_image_url
//     }
//   } catch (e) {
//     console.log(e)
//     throw new Error(e)
//   }
// }
