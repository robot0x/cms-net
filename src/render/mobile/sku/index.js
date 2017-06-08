const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const request = require('request')
const Promise = require('bluebird')
const Log = require('../../../utils/Log')
const metaService = new MetaService()
/**
 * 渲染：
 *  1. SKU页
 *     http://c.diaox2.com/view/app/?m=sku&sid=2112
 *     http://c.diaox2.com/view/app/sku/5239860102340/2112.html
 *     http://c.diaox2.com/view/app/sku/1220/2112.html
 */
class SkuRender extends Render {
  constructor (sid) {
    super()
    this.setSid(sid)
    this.template = this.readTemplate(__dirname + '/sku.ejs')
    this.parser = new Parser()
  }

  setSid (sid) {
    this.sid = sid
    return this
  }

  async rende () {
    let { sid, parser, version } = this
    if (!sid) return
    try {
      const result = await Promise.promisify(request)(
        `http://s5.a.dx2rd.com:3000/v1/getfullsku/${sid}`
      )
      let { state, data } = JSON.parse(result.body)
      if (state && state !== 'SUCCESS') {
        throw Error('调用getfullsku接口失败')
      }
      data = Utils.getFirst(data)
      let { title, brand, sales, images, revarticles } = data || {}
      title = title || ''
      brand = title || brand
      sales = sales || []
      images = images || []
      images = images.map((image, index) => {
        image.id = index
        return image
        // console.log(index)
        // 如果是阿里云图，则加上后缀，否则不用处理
        // return Utils.addAliImageSuffix(image.url)
      })
      // sku页显示的图片
      let thumb = Utils.addAliImageSuffix((images[0] || {}).url) || ''
      const metas = await metaService.getRawMetas(revarticles, false)
      return this.getDoc(this.template, {
        sid,
        title,
        thumb,
        images,
        brand,
        body: parser.setSales(sales).getHTML(),
        // 如果关联文章是一篇新写的文章，但是还没有更新到新CMS的库里，所以导致metas是null。。需要做个兼容
        revarticles: parser.getRevarticleHTML(metas || []),
        prefix: this.prefix,
        version
      })
    } catch (e) {
      console.log(e)
      Log.exception(e)
      return null
    }
  }
}

// const render = new SkuRender
// render.rende().then(data => {
//   console.log(data)
// })

module.exports = SkuRender
