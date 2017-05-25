const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const TagService = require('../../../service/TagService')
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. 作者页 http://c.diaox2.com/view/app/?m=author&src=ZRJ
 */
class TagRender extends Render {
  constructor (tid) {
    super()
    this.setTid(tid)
    this.template = this.readTemplate(__dirname + '/tag.ejs')
    this.parser = new Parser()
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
      if (image.aid === aid) {
        return image
      }
    }
    return null
  }

  async rende () {
    const { parser, tid } = this
    if (!tid) return
    try {
      //  let { metas, thumbs, name } = await new TagService(this.tid).getRenderData()
      let tagService = new TagService(tid)
      let [metaObj, ptag] = await Promise.all([tagService.getRenderData(true, false), tagService.getParentTagByTid(tid)])
      let { metas, images, name } = metaObj
      // 从数据库中读数据然后生成tree的方式与线上的排序不一致且显示的条目也不一致（比如，线上没有显示“有调专栏”这个tag）
      // 所以改为写死在模板里，响应速度由 139.7MS 降到了 60.4MS，响应速度提高了2.3+倍
      // 如果保留sql，但是模板不渲染，响应速度为121.7MS，模板不渲染这块数据只节省了 18MS，节省有限...
      // 所以后端响应慢主要是sql慢或sql多导致的
      // let tags =  await tagService.getTagTree()
      ptag = ptag || {}
      // console.log(metas)
      for (let meta of metas) {
        let { id } = meta
        //  let longid = id * 4294967297
        let longid = Utils.toLongId(id)
        let cover = this._findImageByAid(images, id)
        if (cover) {
          meta.cover_image_url = `//${cover.url}`
        } else {
          meta.cover_image_url =
            '//c.diaox2.com/cms/diaodiao/assets/placehold.gif'
        }
        meta.longid = longid
      }
      //  tags = [{
      //    name: xxx,
      //    tid: 100000,
      //    children: [{
      //      name: yyy,
      //      tid: 100001
      //    },{
      //      name: zzz,
      //      tid: 100002
      //    }]
      //   }]
      return this.getDoc(this.template, {
        name, // tag名称
        pid: ptag.tid || null,
        pname: ptag.name || null,
        // tags,
        body: parser.setMetas(metas).getHTML(),
        version: this.version
      })
    } catch (e) {
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
