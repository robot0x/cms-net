const cheerio = require('cheerio')
const Utils = require('../../../utils/Utils')
const MetaService = require('../../../service/MetaService')
const metaService = new MetaService()
const findMetaById = (id, metas) => {
  for (let meta of metas) {
    if (meta.nid == id) {
      return meta
    }
  }
}
/**
 * [对html内的img标签进行处理，加上]
 * <img alt="" class="lazy" width="596" height="442"  src="//content.image.alimmdn.com/cms/sites/default/files/20141014/firstpage/coffeebeans.jpg@768w_1l" data-big="http://content.image.alimmdn.com/cms/sites/default/files/20141014/firstpage/coffeebeans.jpg">
 * @param  {[type]} html   [description]
 * @param  {[type]} images [description]
 * @return {[type]}        [description]
 */
module.exports = async (html, ids) => {
  const $ = cheerio.load(`<div id="container">${html}</div>`, {
    decodeEntities: false
  })
  const container = $('#container')
  try {
    const articleDoms = Array.from(container.find('.goodthing'))
    const metas = await metaService.getRawMetas(
      ids,
      false, // useBuylink
      true, // isShortId
      true, // useCoverex
      false, // useBanner
      false, // useSwipe
      true // useImageSize
    )
    console.log(metas)
    for (let articleDom of articleDoms) {
      // console.log(articleDom.attribs['data-href'])
      let meta = findMetaById(
        Utils.normalize(articleDom.attribs['data-href']),
        metas
      )
      // 如果meta不存在，就删除这个dom
      if (!meta) {
        $(articleDom).remove()
        continue
      }
      let {ctype, title, cover_image_url, coverex_image_url, coverwidth, coverheight, coverexwidth, coverexheight} = meta
      const $articleDom = $(articleDom)
      let titleDom = $articleDom.find('.title')
      title = (title[0] || '').replace(/ {2}/, '<br>')
      if (titleDom[0]) {
        titleDom.text(title)
      } else {
        $articleDom.find('.mask-title').text(title)
      }
      // 渲染策略：如果是首页，取coverex作为渲染的图，其他的都是取cover
      if (ctype === 1) {
        cover_image_url = coverex_image_url　// eslint-disable-line
        coverwidth = coverexwidth
        coverheight = coverexheight
      }
      // 加上@768_1l 减小图片大小，经测试专刊页可以减少至少10%的下载量
      let img = $articleDom.find('.direct')
      // 图片设置data-w和data-h，由前端js决定图片的大小
      if (coverwidth) {
        img.attr('data-w', coverwidth)
      }
      if (coverheight) {
        img.attr('data-h', coverheight)
      }
      img.attr('src', Utils.addProtocolHead(Utils.addImageOfShowPageAliImageSuffix(cover_image_url)))
    }
  } catch (error) {
    console.log(error)
  }
  return container.html()
}
