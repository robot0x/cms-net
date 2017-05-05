const Render = require('../../')
const Utils = require('../../../utils/Utils')
const Parser = require('./parser')
const TagService = require('../../../service/TagService')
/**
 * 渲染：
 *  1. 作者页 http://c.diaox2.com/view/app/?m=author&src=ZRJ
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
    //  let { metas, thumbs, name } = await new TagService(this.tid).getRenderData()
     let tagService = new TagService(tid)
     let { metas, images, name } = await tagService.getRenderData(false)
     let ptag =  await tagService.getParentTagByTid(tid)
     let tags =  await tagService.getTagTree()
     ptag = ptag || {}
     let infos = ''
     // console.log(metas)
     for (let meta of metas) {
       let {id, title} = meta
       let longid = id * 4294967297
       let cover = this._findImageByAid(images, id)
       if(cover) {
         meta.cover_image_url = `//${cover.url}`
       } else {
         meta.cover_image_url = '//c.diaox2.com/cms/diaodiao/assets/placehold.gif'
       }
       meta.longid = longid
     }
     console.log('ptag:', ptag)
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
        tags,
        body: parser.setMetas(metas).getHTML(),
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
