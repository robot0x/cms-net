const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const request = require('request')
const Promise = require('bluebird')
const Log = require('../../../utils/Log')
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
    this.parser = new Parser
  }

  setSid (sid) {
    this.sid = sid
    return this
  }

  async rende () {
    let {sid, parser, version} = this
    if(!sid) return
     try {
       let metaService = new MetaService
       const result = await Promise.promisify(request)(`http://s5.a.dx2rd.com:3000/v1/getfullsku/${sid}`)
       let {state, data} = JSON.parse(result.body)
       if(state !== 'SUCCESS') {
         throw Error('调用getfullsku接口失败')
       }
       data = Utils.getFirst(data)
       console.log(JSON.stringify(data))
       let {title, brand, sales, images, revarticles} = data
       images = images.map(image => image.url)
       const metas = await metaService.getRawMetas(revarticles, false)
       return this.getDoc(this.template, {
          sid,
          title,
          images,
          brand,
          body: parser.setSales(sales).getHTML(),
          revarticles: parser.getRevarticleHTML(metas),
          prefix: this.prefix,
          version
        })
     } catch (e) {
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
