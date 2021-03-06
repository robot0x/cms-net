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
const TagIndexTable = require('../db/TagIndexTable')
const DB = require('../db/DB')
const Utils = require('../utils/Utils')
const Log = require('../utils/Log')
const SKU = require('../utils/SKU')
const _ = require('lodash')
// const Base = require('../Base')
// const startDate = require('../../config/app').startDate

class MetaService {
  constructor (id) {
    // super()
    this.metaTable = new MetaTable()
    this.contentTable = new ContentTable()
    this.imageTable = new ImageTable()
    this.authorTable = new AuthorTable()
    this.buyinfoTable = new BuyinfoTable()
    this.tagIndexTable = new TagIndexTable()
    // this.setId(id)
  }

  // setId (id) {
  //   this.id = id
  //   return this
  // }
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
    if (isSwipe) {
      ret = []
      for (let image of images) {
        if (image.aid == aid && (image.type & type) == type) {// eslint-disable-line
          ret.push(image)
        }
      }
    } else {
      for (let image of images) {
        if (image.aid == aid && (image.type & type) == type) { // eslint-disable-line
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
    useCoverex = true,
    useBanner = false,
    useSwipe = false,
    useImageSize = false,
    useAuthorSource = false,
    useTag = false,
    useLastUpdateTime = false
  ) {
    // 参数处理
    if (!Utils.isValidArray(ids)) {
      // 如果只传入一个id，则转化为数组，否则，参数不合法，直接返回
      if (/^\d+$/.test(ids)) {
        ids = [ids]
      } else {
        return null
      }
    }
    // 内部使用这个参数，稍微提升点儿性能
    if (!isShortId) {
      ids = Utils.toShortId(ids)
    }
    let source = useAuthorSource ? 'au.source AS source,' : ''
    // TR接口要用到，是用来排序的，最新修改的文章要排在最前面
    let lastUpdateTime = useLastUpdateTime ? 'meta.last_update_time,' : ''
    // 取meta需要加上时间限制，timetopublish必须处在20141108和今天之间
    // 专刊类型的timetopublish都为0，要想拿专刊类型的meta，需要坐下兼容
    // TODO: 如果作者存在，则会返回空meta，这个需要做下兼容。比如，填写了“陈老湿”，这个是title而不是source
    // 导致 meta.author = au.source 不成立！所以下面的sql的结果集就是空的
    const sql = `
    SELECT 
      meta.id AS nid, 
      meta.title,
      meta.titleex,
      meta.titlecolor,
      meta.ctype,
      meta.price,
      meta.buylink,
      meta.timetopublish,
      ${source}
      ${lastUpdateTime}
      au.pic_uri,
      au.title AS author_name
    FROM 
     diaodiao_article_meta AS meta ,
     diaodiao_author AS au 
    WHERE 
     meta.id in (${ids.join(',')}) 
    AND 
     meta.author = au.source 
    AND
    (
     ${Utils.genTimetopublishInterval('meta.timetopublish')}
    OR 
     ctype = 9
    )
    `
    // console.log('getRawMetas\'s sql:', sql)
    try {
      let promises = [DB.exec(sql)]
      if (useBuylink) {
        promises.push(this.getBuylink(ids))
      }
      let [metaAndAuthors, buylinks] = await Promise.all(promises)
      console.log('buylinks:', buylinks)
      buylinks = buylinks || []
      // console.log('metaAndAuthors:', metaAndAuthors);
      // console.log('[MetaService.getRawMetas]:', metaAndAuthors)
      let imageCols = ['aid', "CONCAT('//', url) AS url", 'type']

      if (useImageSize) {
        imageCols.push('width')
        imageCols.push('height')
      }
      //  0未设置类型,没有被使用/第1位-内容图(1)/第2位cover图(2)/第3位coverex图(4)/第4位thumb图(8)/第5位swipe图(16)/第6位banner图(32)
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

      const images = (await this.imageTable.getSpecialImagesUrl(
        ids,
        imageTypes,
        imageCols
      )) || []
      let metas = []

      for (let me of metaAndAuthors) {
        let {
          nid,
          title,
          titleex,
          // titlecolor,
          ctype,
          price,
          pic_uri,
          source,
          author_name,
          timetopublish
        } = me
        // console.log('getRawMetas:', me);
        title = titleex ? [title, titleex || ''] : [title || ''] // 防止出现[null]的情况，这种情况应该转换为空数组，即[]
        let meta = Object.create(null) // 使用超轻量对象，提升性能
        meta.timetopublish = timetopublish
        // author字段变形
        meta.author = { pic: pic_uri, name: author_name }
        if (useAuthorSource) {
          meta.author.source = source
        }
        // 这个可能在app内用来控制title的颜色
        meta.title_color = meta.titlecolor || 4294967295
        meta.title = title
        meta.price = price || 'N/A'
        meta.ctype = ctype
        meta.type = Utils.ctypeToType(ctype)
        // is_external是否是外部文章，现在几乎没有了，所以默认为false
        meta.is_external = false
        let coverImage = this._findImageByAidAndType(nid, 2, images) || {}
        let thumbImage = this._findImageByAidAndType(nid, 8, images) || {}

        meta.cover_image_url = Utils.addProtocolHead(coverImage.url)
        meta.thumb_image_url = Utils.addProtocolHead(thumbImage.url)
        let coverexImage = null
        let bannerImage = null
        let swipeImages = null // 走马灯图，可能有多个

        if (useCoverex) {
          coverexImage = this._findImageByAidAndType(nid, 4, images) || {}
          if (coverexImage) {
            meta.coverex_image_url = Utils.addProtocolHead(coverexImage.url)
          }
        }

        if (useSwipe) {
          swipeImages = this._findImageByAidAndType(nid, 16, images) || {}
          if (Utils.isValidArray(swipeImages)) {
            meta.swipe_image_url = swipeImages.map(swipe =>
              Utils.addProtocolHead(swipe.url)
            )
          }
        }

        // 如果文章使用了banner图，就使用cms.banner，否则meta不用包含这个字段
        if (useBanner) {
          bannerImage = this._findImageByAidAndType(nid, 32, images) || {}
          if (bannerImage && bannerImage.url) {
            meta.banner = Utils.addProtocolHead(bannerImage.url)
          }
        }

        if (useImageSize) {
          meta.coverwidth = coverImage.width || 0
          meta.coverheight = coverImage.height || 0
          meta.thumbwidth = thumbImage.width || 0
          meta.thumbheight = thumbImage.height || 0

          if (useCoverex && coverexImage) {
            meta.coverexwidth = coverexImage.width || 0
            meta.coverexheight = coverexImage.height || 0
          }

          if (useBanner && bannerImage) {
            meta.bannerwidth = bannerImage.width || 0
            meta.bannerheight = bannerImage.height || 0
          }
        }

        meta.nid = nid
        // buylink处理
        // 对于tag页、author页等页面渲染，或只需拿到简单的meta（比如只需要title,cover_image_url），
        // 所以我们就没有必要处理buylink，处理buylink很耗费性能。
        if (useBuylink) {
          // 使用null_cms_link作为getBuylink在meta表中是否有
          // buylink字段的标志，否则的话，meta.buylink为undefined，
          // 则会再通过id拿一次buylink，这是没必要的且费性能
          let buylink = Utils.getFirst(buylinks.filter(info => info.id === nid))
          if (buylink) {
            meta.has_buylink = true
            meta.buylink = buylink.link
          } else if (me.buylink) {
            meta.has_buylink = true
            meta.buylink = me.buylink
          } else {
            meta.has_buylink = false
          }
        }
        metas.push(meta)
      }
      // tag处理
      if (useTag) {
        let tags = await this.tagIndexTable.getByAids(ids)
        if (!Utils.isValidArray(tags)) {
          metas = metas.map(meta => {
            meta.tag = ''
            return meta
          })
        } else {
          metas = metas.map(meta => {
            let { nid } = meta
            let theTagsOfThisMeta = tags.filter(tag => tag.aid === nid)
            if (!Utils.isValidArray(theTagsOfThisMeta)) {
              meta.tag = ''
              return meta
            }
            let theTagsOfTag1IsYoudiaozhuanlan = theTagsOfThisMeta.filter(
              tag => tag.tag1 === '有调专栏'
            )
            if (!Utils.isValidArray(theTagsOfTag1IsYoudiaozhuanlan)) {
              meta.tag = ''
              return meta
            } else {
              let theFirstTagInfoOfTag1IsYoudiaozhuanlan = Utils.getFirst(
                theTagsOfTag1IsYoudiaozhuanlan
              )
              meta.tag = theFirstTagInfoOfTag1IsYoudiaozhuanlan.tag2
              return meta
            }
          })
        }
      }
      // 如果只传一个id，则返回 {}   形式
      // 如果传有多个id，则返回 [{}] 形式
      if (ids.length === 1 && metas.length === 1) {
        return Utils.getFirst(metas)
      } else {
        return metas.length > 0 ? metas : null
      }
    } catch (e) {
      Log.exception(e)
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
    const { metaTable, contentTable, imageTable, authorTable } = this
    // async函数返回的就是promise，所以无需再包一promise
    try {
      let [meta, images, content] = await Promise.all([
        metaTable
          .setColumns([
            'title',
            'titleex',
            'ctype',
            'timetopublish',
            'price',
            'author'
          ])
          .getById(id),

        imageTable
          .setColumns(['url', 'type', 'alt', 'width', 'height'])
          .getByAid(id),

        contentTable.getById(id)
      ])
      // let { timetopublish } = meta
      // if (timetopublish < startDate ||
      //     timetopublish > Utils.genStarAndEndDateForTimetopublish().endDate
      // ) {
      //   return
      // }
      // 由于author表目前的数据很少，所以写死
      // console.log('MetaService meta.author:', meta.author)
      const promises = [authorTable.getBySource(meta.author)]
      // 根据规则拿购买链接，把meta表中的购买链接作为第二个参数，这样在条件命中时，我们就能少访问一次数据库
      if (useBuylink) {
        promises.push(this.getBuylink(id, meta.buylink || 'null_cms_link'))
      }
      let [author, buylink] = await Promise.all(promises)
      author.pic_uri = Utils.addUrlPrefix(author.pic_uri)
      if (buylink) {
        meta.has_buylink = true
        meta.buylink = buylink
      } else {
        meta.has_buylink = false
      }
      return { meta, images, content, author }
    } catch (e) {
      Log.exception(e)
      return null
    }
  }
  async getBuylink (ids, getBuylinkFromMetaTable = false) {
    if (!ids) return null
    // 如果ids为一个数组，则返回一个数组，否则返回一个对象
    let getOne = true
    if (Array.isArray(ids)) {
      getOne = false
    }
    if (getOne) {
      ids = [ids]
    }
    ids = Utils.toShortId(ids)
    let cmsBuyLink = ''
    if (typeof getBuylinkFromMetaTable === 'string') {
      cmsBuyLink = getBuylinkFromMetaTable
      getBuylinkFromMetaTable = true
    }
    const [skuData, buyinfos] = await Promise.all([
      SKU.getSkusByArticleIds(ids, false),
      this.buyinfoTable.getByAids(ids)
    ])
    let ret = []
    // console.log('ids:', ids)
    for (let id of ids) {
      let skus = skuData[id]
      let data = Object.create(null)
      let buyinfo = Utils.getFirst(buyinfos.filter(info => info.aid === id))
      console.log('skus.length:', skus.length)
      console.log('buyinfos.length:', buyinfos.length)
      console.log('buyinfo:', buyinfo)
      console.log('valid SKU:', SKU.isOnlyOneOnlineSKU(skus))
      if (SKU.isOnlyOneOnlineSKU(skus)) {
        // console.log('sku ....')
        data.id = id
        data.link = `https://c.diaox2.com/view/app/sku/${Utils.toLongId(id)}/${skus[0].sid}.html`
      } else if (buyinfo && buyinfo.link) {
        // console.log('buyinfo ....')
        data.id = id
        data.link = `https://c.diaox2.com/view/app/?m=buy&aid=${id}`
      } else if (getBuylinkFromMetaTable) {
        data.id = id
        if (!cmsBuyLink) {
          cmsBuyLink = await this.metaTable.getBuylinkById(id)
        } else if (cmsBuyLink === 'null_cms_link') {
          cmsBuyLink = ''
        }
        data.link = cmsBuyLink
      }
      if (!_.isEmpty(data)) {
        ret.push(data)
      }
    }
    console.log('prev ret:', ret)
    if (getOne) {
      [ret] = ret
      if (ret) {
        ret = ret.link || ''
      } else {
        ret = ''
      }
    }
    console.log('next ret:', ret)
    return ret
  }
  /**
   * 如果文章仅有1个sku，那么将这个sku的链接http://c.diaox2.com/view/app/sku/cid/sid.html，作为购买链接，has_buy_link = true，处理结束
     如果文章有0个或者多个sku，那么看文章有没有老的传统购买页，如果有，将http://c.diaox2.com/view/app/?m=buy&aid=nid，作为购买链接，has_buy_link = true，处理结束
     否则看看文章有没有填写cms.buylink字段，如果填写了，用这个。has_buy_link = true，处理结束

     sku的status字段：0/1/2/4, 编辑/在线/失效/...
     目前业务上只用了0和1，0未发布，1代表发布
   */
  // async getBuylink (id, cmsBuyLink = '', withId = false) {
  //   if (!id) return
  //   const skus = await SKU.getSkusByArticleId(id, false)
  //   let buylink = null
  //   let sid = 0
  //   if (SKU.isOnlyOneOnlineSKU(skus)) {
  //     // SKU的页面支持长短aid，但是为了兼容老的，故转成长id
  //     sid = skus[0].sid
  //     buylink = `https://c.diaox2.com/view/app/sku/${Utils.toLongId(id)}/${sid}.html`
  //     // return `http://c.diaox2.com/view/app/sku/${Utils.toLongId(id)}/${skus[0].sid}.html`
  //   } else {
  //     // 若SKU有0个或多个，则从diaodiao_buyinfo取购买页
  //     // const buy_info = await this.metaTable.exec(`SELECT * FROM diaodiao_buyinfo where aid = ${id}`)
  //     const buyInfo = await this.buyinfoTable.getByAid(id)
  //     // 如果diaodiao_buyinfo表存在购买信息
  //     if (buyInfo.length > 0) {
  //       let firstBuyInfo = buyInfo[0]
  //       if (firstBuyInfo.link) {
  //         buylink = `https://c.diaox2.com/view/app/?m=buy&aid=${id}`
  //       }
  //       // return `http://c.diaox2.com/view/app/?m=buy&aid=${id}`
  //     } else if (cmsBuyLink && cmsBuyLink !== 'null_cms_link') {
  //       buylink = cmsBuyLink
  //       // return cmsBuyLink
  //     } else {
  //       buylink = await this.metaTable.getBuylinkById(id)
  //     }
  //   }
  //   let ret = null
  //   if (withId) {
  //     ret = {
  //       cid: id,
  //       link: buylink
  //     }
  //   } else {
  //     ret = buylink
  //   }
  //   return ret
  // }
}
// ids = [this.id],
// useBuylink = true,
// isShortId = false,
// useCoverex = true,
// useBanner = false,
// useSwipe = false,
// useImageSize = false,
// useAuthorSource = false,
// useTag = false,
// useLastUpdateTime = false
// let metaService = new MetaService()
// metaService
//   .getRawMetas(
//     // [8763, 9757, 9233, 1],
//     [2177, 1598, 590, 9833, 1],
//     true,
//     false,
//     false,
//     false,
//     false,
//     false,
//     true,
//     false
//   )
//   .then(data => {
//     console.log(data)
//   })
// metaService.getBuylink(9833).then(data => {
//   console.log('(1)9833:', data)
// })
// metaService.getBuylink2(9833).then(data => {
//   console.log('(2)9833:', data)
// })
// metaService.getBuylink(1138).then(data => {
//   console.log('(1)1138:', data)
// })
// metaService.getBuylink2(1138).then(data => {
//   console.log('(2)1138:', data)
// })
// metaService.getBuylink(1047).then(data => {
//   console.log('(1)1047:', data)
// })
// metaService.getBuylink2(1047).then(data => {
//   console.log('(2)1047:', data)
// })
// metaService.getBuylink(1598).then(data => {
//   console.log('(1)1598:', data)
// })
// metaService.getBuylink2(1598).then(data => {
//   console.log('(2)1598:', data)
// })
// metaService.getBuylink(2177).then(data => {
//   console.log('(1)2177:', data)
// })
// metaService.getBuylink2(2177).then(data => {
//   console.log('(2)2177:', data)
// })
// metaService.getBuylink([2177, 1598, 590, 9833]).then(data => {
//   console.log('(2)[2177, 1598, 590, 9833]:', data)
// })
module.exports = MetaService
