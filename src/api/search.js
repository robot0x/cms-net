const moment = require('moment')
const Utils = require('../utils/Utils')
const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const MetaTable = require('../db/MetaTable')
const metaTable = new MetaTable()
const Log = require('../utils/Log')
const _ = require('lodash')
/**
 * TR和TS接口，因为每条数据多并且还需要查询buylink，
 * 若一次性查询的数据过多，可能会引起超时，这个要注意
 * @class Search
 */

class Search {
  async doQuery (cond) {
    let ret = { metas: [] }
    try {
      const aids = await metaTable.getAidsByCond(cond)
      if (!Utils.isValidArray(aids)) return ret
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
      const metas = await metaService.getRawMetas(
        aids,
        true,  // useBuylink
        false, // isShortId
        true,  // useCoverex
        true,  // useBanner
        true,  // useSwipe
        false, // useImageSize
        false, // useAuthorSource
        false, // useTag
        true   // useLastUpdateTime
      )
      if (!Utils.isValidArray(metas)) return ret
      // 按照type排序，方便编辑在pub页上看数据，ctype越小，排序越靠上
      metas.sort((m1, m2) => Utils.typeToCtype(m1.type) - Utils.typeToCtype(m2.type))
      metas.sort((m1, m2) => m2.last_update_time - m1.last_update_time)
      for (let meta of metas) {
        ret.metas.push(this._handleMeta(meta))
      }
    } catch (error) {
      Log.exception(error)
    }
    return ret
  }

  async byIds (aids) {
    // ids = [this.id],
    // useBuylink = true,
    // isShortId = false,
    // useCoverex = true,
    // useBanner = false,
    // useSwipe = false,
    // useImageSize = false,
    // useAuthorSource = false,
    // useTag = false
    Log.business(`[API SearchByIds] 输入参数为：${aids}`)
    let ret = {metas: []}
    let metas = (await metaService.getRawMetas(
        aids,
        true, // useBuylink
        false, // isShortId
        true, // useCoverex
        true, // useBanner
        true // useSwipe
      )) || []
    console.log('metas:', metas)
    if (_.isPlainObject(metas)) {
      metas = [metas]
    }
    if (!Utils.isValidArray(metas)) return ret
    metas = metas.map(meta => this._handleMeta(meta))
    // 按照type排序，方便编辑在pub页上看数据
    metas.sort((m1, m2) => Utils.typeToCtype(m2.type) - Utils.typeToCtype(m1.type))
    return { metas }
  }

  byTitle (title) {
    Log.business(`[API SearchByTitle] 输入参数为：${title}`)
    return this.doQuery(` title like '%${title}%' `)
  }

  byDate (start, end) {
    Log.business(`[API SearchByDate] 输入参数为：start = ${start}, end = ${end}`)
    let pattern = 'YYYYMMDD'
    if (!start || !/\d{8}/.test(start)) {
      // 如果没有起始日期，则定为 昨天
      start = moment().subtract(1, 'days').format(pattern)
    }
    if (!end || !/\d{8}/.test(end)) {
      // 如果没有结束日期，则定为 今天
      end = moment().format(pattern)
    }
    start = Number(start)
    end = Number(end)
    if (start > end) {
      [start, end] = [end, start] // 交换位置
    }
    // stimestamp = moment(start, pattern).valueOf()
    // etimestamp = moment(end, pattern).valueOf()
    return this.doQuery(` timetopublish BETWEEN ${start} AND ${end} `)
    // return this.doQuery(` create_time BETWEEN ${DB.escape(new Date(stimestamp))} AND ${DB.escape(new Date(etimestamp))} `)
  }
  /**
   * {
    "nid": "7691",
    "type": "activity",
    "title": "5杯星巴克的价格，把“咖啡师”带回家",
    "titlecolor": 4294967295,
    "thumb": "http://content.image.alimmdn.com/cms/sites/default/files/20160920/firstpage/188.jpg",
    "thumbheight": "188",
    "thumbwidth": "188",
    "serverid": 33032593481227,
    "oriUrl": "/view/app/?m=show&id=7691&ch=firstpage",
    "url": "/view/app/?m=show&id=7691",
    "share": "/share/33032593481227.html",
    "cover": "http://content.image.alimmdn.com/cms/sites/default/files/20160920/firstpage/640_0.jpg",
    "coverex": "http://content.image.alimmdn.com/cms/sites/default/files/20160920/firstpage/720_1.jpg",
    "coverwidth": "720",
    "coverheight": "300",
    "banner": "http://content.image.alimmdn.com/cms/sites/default/files/20160920/firstpage/banner.jpg",
    "price": "N/A",
    "buy": "/view/app/?m=buy&aid=7691",
    "body": "",
    "thumbclass": "",
    "coverclass": " debug",
    "applink": "diaodiao://c.diaox2.com/view/app/?m=show&id=7691"
}
   */
  _handleMeta (meta) {
    try {
      const {
        nid,
        thumb_image_url,
        cover_image_url,
        coverex_image_url,
        banner,
        buylink,
        title,
        title_color,
        ctype,
        price
      } = meta
      let longId = Utils.toLongId(nid)
      let ret = Object.create(null)
      // nid字段，就是文章的短id
      ret.nid = nid
      if (ctype === 5) {
        ret.ctype = 1
        ret.type = Utils.ctypeToType(ret.ctype)
      } else {
        ret.type = Utils.ctypeToType(ctype)
      }
      ret.thumb = thumb_image_url; // eslint-disable-line
      ret.cover = cover_image_url; // eslint-disable-line
      ret.coverex = coverex_image_url; // eslint-disable-line
      ret.titlecolor = title_color; // eslint-disable-line
      ret.buy = buylink
      let [mtitle, titleex] = title
      // title字段，string类型，但是要将cms里面title里的连续两个空格，替换为'<br>'
      ret.title = mtitle.replace(/ {2}/, '<br>')
      // 策略1：如果titleex存在就下发，否则不下发
      if (titleex && titleex.trim()) {
        ret.titleex = titleex
      }
      // 策略2：如果文章是专刊，调整返回的title字段为 title = title + '⌘' + titleex
      if (ctype === 3 && titleex) {
        ret.title = ret.title + '⌘' + titleex
      }
      // 策略3：titlecolor字段，如果cms里有，直接返回，如果是0或者没有，设置为4294967295
      if (!ret.titlecolor) {
        ret.titlecolor = 4294967295
      }
      ret.price = price
      // 策略4：如果有price，返回，否则返回'N/A'
      if (!price) {
        ret.price = 'N/A'
      }
      // 策略5：如果有sku，且只关联了1个，那么返回sku地址 否则无条件返回buy购买页地址，不论这篇文章是否有购买页数据
      ret.buy = buylink
      if (!buylink) {
        ret.buy = `http://c.diaox2.com/view/app/?m=buy&aid=${nid}`
      }
      ret.body = ''
      // ret.coverclass = ' debug'
      ret.url = `/view/app/?m=${Utils.ctypeToM(ctype)}&id=${nid}`
      ret.applink = `diaodiao://c.diaox2.com${ret.url}`
      ret.share = `/share/${longId}.html`
      ret.serverid = longId
      // banner字段，如果cms里有banner字段，返回banner的url，是一张图；否则没有这个key
      if (banner) {
        ret.banner = banner
      }
      return ret
    } catch (error) {
      console.log(error)
    }
  }
}

module.exports = new Search()
