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
module.exports = async (html, markdown) => {
  const $ = cheerio.load(`<div id="container">${html}</div>`, {
    decodeEntities: false
  })
  const container = $('#container')
  try {
    // console.log(markdown)
    const articleDoms = Array.from(container.find('.ztcard'))
    const data = Utils.getZtDataByParseMarkdown(markdown)
    const ids = Object.keys(data.article)
    const metas = await metaService.getRawMetas(ids, false, true)
    for (let articleDom of articleDoms) {
      let id = Utils.normalize(articleDom.attribs['data-href'])
      let meta = findMetaById(
        id,
        metas
      )
      // 如果meta不存在，就删除这个dom
      if (!meta) {
        $(articleDom).remove()
        continue
      }
      const $articleDom = $(articleDom)
      $articleDom.find('.p1').text(meta.title[0])
      $articleDom.find('.p2').text(data.article[id])
      $articleDom.find('img').attr('src', meta.thumb_image_url)
    }
  } catch (error) {
    console.log(error)
  }
  return container.html()
}
