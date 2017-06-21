const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const TagService = require('../../../service/TagService')
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. tag页
 *   http://c.diaox2.com/view/app/?m=tag&tid=100000
 *   http://www.diaox2.com/category/100000.html
 */
class TagRender extends Render {
  constructor () {
    super()
    // this.setTid(tid)
    this.template = this.readTemplate(__dirname + '/tag.ejs')
    this.parser = new Parser()
    this.tagService = new TagService()
  }
  /**
   * 在 cms-net.js 中调用，解析url参数之后，调用setId
   */
  // setTid (tid) {
  //   this.tid = tid
  //   return this
  // }

  _findImageByAid (images, aid) {
    for (let image of images) {
      if (image.aid == aid) {
        return image
      }
    }
    return null
  }

  async rende (tid) {
    const { parser, tagService } = this
    if (!tid) return
    try {
      //  只有前20条数据是服务端渲染出来的，后面的数据由前端js拿
      let limit = 20
      let { metas, images, name } = (await tagService
        .setLimit(limit)
        .getRenderData(tid)) || {images: [], metas: [], name: ''}
      let allarticles = []
      let infos = Object.create(null)
      // let len = allarticles.length
      // console.log(metas)
      for (let meta of metas) {
        let { id, title } = meta
        let longid = Utils.toLongId(id)
        allarticles.push(longid)
        infos[longid] = title
        //  需要把取出来的前 limit 条 缩略图 attach 到具有相同aid的meta上
        let thumb = this._findImageByAid(images, id)
        if (thumb) {
          meta.thumb_image_url = `//${thumb.url}`
        } else {
          meta.thumb_image_url =
            '//c.diaox2.com/cms/diaodiao/assets/placehold.gif'
        }
        meta.id = longid
        meta.url = `//c.diaox2.com/view/app/?m=show&id=${id}`
      }
      return this.getDoc(this.template, {
        name,
        allarticles: JSON.stringify(allarticles),
        infos: JSON.stringify(infos),
        body: parser.setMetas(metas).getHTML(limit),
        prefix: this.prefix,
        version: this.version
      })
    } catch (e) {
      console.log(e)
      Log.exception(e)
      return null
    }
  }
}
//
// var author = new TagRender(1)
// show.rende()

// console.log(parser.getHTML())

module.exports = TagRender
