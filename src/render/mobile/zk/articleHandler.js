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
    const metas = await metaService.getRawMetas(ids, false, true)
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
      const $articleDom = $(articleDom)
      let titleDom = $articleDom.find('.title')
      let title = (meta.title[0] || '').replace(/ {2}/, '<br>')
      if (titleDom) {
        titleDom.text(title)
      } else {
        $articleDom.find('.mask-title').text(title)
      }
      // 加上@768_1l 减小图片大小，经测试专刊页可以减少至少10%的下载量
      $articleDom.find('.direct').attr('src', Utils.addProtocolHead(Utils.addImageOfShowPageAliImageSuffix(meta.cover_image_url)))
    }
  } catch (error) {
    console.log(error)
  }
  return container.html()
}
