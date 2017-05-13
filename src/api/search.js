const DB = require('../db/DB')
const moment = require('moment')
const Utils = require('../utils/Utils')
const MetaService = require('../service/MetaService')
const metaService = new MetaService
const MetaTable = require('../db/MetaTable')
const metaTable = new MetaTable
const Log = require('../utils/Log')

class Search {
  async doQuery (cond) {
    const ret = []
    try {
      const aids = await metaTable.getAidsByCond(cond)
      if(!Utils.isValidArray(aids)) return null
      const metas = await metaService.getRawMetas(aids, true, true, true, true, true)
      if(!Utils.isValidArray(metas)) return null
      metas.sort((m1, m2) => m2.timetopublish - m1.timetopublish)
      for (let meta of metas) {
        ret.push(this._handleMeta(meta))
      }
    } catch (error) {
      Log.exception(error)
    }
    return ret.length > 1? {metas: ret} : null
  }

  byTitle (title) {
    Log.bussiness(`[API SearchByTitle] 输入参数为：${title}`)
    return this.doQuery(` title like '%${title}%' `)
  }

  byDate (start, end) {
    Log.bussiness(`[API SearchByDate] 输入参数为：start = ${start}, end = ${end}`)
    let pattern = 'YYYYMMDD'
    if(!start || !/\d{8}/.test(start)){
      // 如果没有起始日期，则定为 昨天
      start = moment().subtract(1, 'days').format(pattern)
    }
    if(!end || !/\d{8}/.test(end)){
      // 如果没有结束日期，则定为 今天
      end = moment().format(pattern)
    }
    start = Number(start)
    end = Number(end)
    if(start > end) {
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
    const { nid } = meta
    meta.thumb = meta.thumb_image_url
    meta.cover = meta.cover_image_url
    meta.coverex = meta.coverex_image_url
    meta.banner = meta.banner_image_url
    meta.buy = meta.buylink
    meta.title = meta.title.join(',')

    let longId = Utils.toLongId(nid)
    meta.body = ''
    meta.thumbclass = ''
    meta.coverclass = ' debug'
    meta.applink = `diaodiao://c.diaox2.com/view/app/?m=${Utils.ctypeToM(meta.ctype)}&id=7691`
    meta.url = meta.oriUrl = `/view/app/?m=${Utils.ctypeToM(meta.ctype)}&id=${nid}`
    meta.share = `/share/${longId}.html`
    meta.share = `/share/${longId}.html`
    meta.serverid = longId
    delete meta.thumb_image_url
    delete meta.cover_image_url
    delete meta.coverex_image_url
    delete meta.banner_image_url
    delete meta.bannerwidth
    delete meta.bannerheight
    delete meta.buylink
    delete meta.author
    delete meta.ctype
    delete meta.has_buylink
    delete meta.is_external
    delete meta.timetopublish

    return meta
  }
}

module.exports = new Search
