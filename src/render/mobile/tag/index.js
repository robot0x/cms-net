const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const TagService = require('../../../service/TagService')
/**
 * 渲染：
 *  1. 作者页 http://www.diaox2.com/category/100003.html
 */
class TagRender extends Render {

  constructor (tid) {
    super()
    this.setTid(tid)
    this.template = this.readTemplate(__dirname + '/tag.ejs')
    this.parser = new Parser
  }
  /**
   * 在 cms-net.js 中调用，解析url参数之后，调用setId
   */
  setTid (tid) {
    this.tid = tid
    return this
  }

  _findImageByAid (images, aid) {
    for (let image of images) {
      if(image.aid === aid) {
        return image
      }
    }
    return null
  }

  async rende () {
   const { parser, tid } = this
   if(!tid) return
   try {
     let limit = 20
     let { metas, images, name } = await new TagService(tid).setLimit(limit).getRenderData()
     let allarticles = []
     let infos = ''
     let len = allarticles.length
     // console.log(metas)
     for (let meta of metas) {
       let {id, title} = meta
       let longid = Utils.toLongId(id)
       allarticles.push(longid)
       infos += `"${longid}":"${escape(title).replace(/%u/g,'\\u').replace(/%20/g,' ')}",`
       let thumb = this._findImageByAid(images, id)
       if(thumb) {
         meta.thumb_image_url = `//${thumb.url}`
       } else {
         meta.thumb_image_url = '//c.diaox2.com/cms/diaodiao/assets/placehold.gif'
       }
       meta.id = longid
       meta.url = `//c.diaox2.com/view/app/?m=show&id=${id}`
     }
     return this.getDoc(this.template, {
        name,
        allarticles,
        infos: infos,
        body: parser.setMetas(metas).getHTML(limit),
        prefix: this.prefix,
        version: this.version
      })
   } catch (e) {
     console.log(e)
   }
  }
}
//
// var author = new TagRender(1)
// show.rende()

// console.log(parser.getHTML())

module.exports = TagRender
