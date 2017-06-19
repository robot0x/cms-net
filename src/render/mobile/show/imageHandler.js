const cheerio = require('cheerio')
const Utils = require('../../../utils/Utils')
const placeholder = require('../../../../config/app').placeholder
var findByUrl = (url, images) => {
  for (let image of images) {
    if (image.url.indexOf(url) !== -1) {
      return image
    }
  }
  return null
}
/**
 * [对html内的img标签进行处理，加上]
 * <img
 *    alt=""
 *    class="lazy"
 *    width="596"
 *    height="442"
 *    src="//content.image.alimmdn.com/cms/sites/default/files/20141014/firstpage/coffeebeans.jpg@768w_1l"
 *    data-big="http://content.image.alimmdn.com/cms/sites/default/files/20141014/firstpage/coffeebeans.jpg">
 * @param  {[type]} html   [description]
 * @param  {[type]} images [description]
 * @return {[type]}        [description]
 * BUG: 2017-05-23 diaodiao_article_image 中的某些图片还是老的，diaodiao_article_content中引用的是新的，
 * 所以导致 findByUrl 找不到结果，导致图片没有加上width和height属性，导致图片超出页面范围
 */
module.exports = (html, images, usePlaceholder = true) => {
  const $ = cheerio.load(`<div id="container">${html}</div>`, { decodeEntities: false })
  const container = $('#container')
  const imgs = Array.from(container.find('img'))
  for (let img of imgs) {
    let image = findByUrl(Utils.removeProtocolHead(img.attribs.src), images)
    if (image) {
      let {attribs} = img
      if ($(img).hasClass('articleimg')) {
        continue
      }
      let big = '//' + image.url
      img.attribs.alt = image.alt
      img.attribs.width = attribs['data-w'] = image.width
      img.attribs.height = attribs['data-h'] = image.height
      if (usePlaceholder) {
        img.attribs.src = '//' + placeholder
      }
      img.attribs['data-big'] = big
      img.attribs['data-src'] = Utils.addImageOfShowPageAliImageSuffix(big)
    }
    // 不管是否有图，都加上lazy，因为lazy有样式，其中有 width:100%
    // 如果我们由于同步不及时或者使用的外部的图片
    // 则图片过大的话，会超出页面主容器，所以做个兜底
    $(img).addClass('lazy')
  }
  return container.html()
}
