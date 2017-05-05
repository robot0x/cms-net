const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const MetaService = require('../../../service/MetaService')
const request = require('request')
const Promise = require('bluebird')
/**
 * 渲染：
 *  1. 购买页 http://c.diaox2.com/view/app/sku/2112.html
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
       const metas = await metaService.getRawMetas(revarticles)
       return this.getDoc(this.template, {
          sid,
          title,
          images,
          brand,
          body: parser.setSales(sales).getHTML(),
          revarticles: parser.getRevarticleHTML(metas),
          version
        })
     } catch (e) {
       console.log(e)
      throw Error('调用getfullsku接口失败')
     }
    }
}

// const render = new SkuRender
// render.rende().then(data => {
//   console.log(data)
// })

module.exports = SkuRender
