const cheerio = require('cheerio')
const Utils = require('../../../utils/Utils')
var findByUrl = (url, images) => {
  for(let image of images){
    if(image.url.indexOf(url) !== -1){
      return image
    }
  }
  return null
}
/**
 * [对html内的img标签进行处理，加上]
 * <img alt="" class="lazy" width="596" height="442"  src="//content.image.alimmdn.com/cms/sites/default/files/20141014/firstpage/coffeebeans.jpg@768w_1l" data-big="http://content.image.alimmdn.com/cms/sites/default/files/20141014/firstpage/coffeebeans.jpg">
 * @param  {[type]} html   [description]
 * @param  {[type]} images [description]
 * @return {[type]}        [description]
 */
module.exports = (html, images) => {
  console.log('html:', html)
  console.log('images:', images)
  const $ = cheerio.load(`<div id="container">${html}</div>`,{ decodeEntities: false })
  const container = $('#container')
  const imgs = Array.from(container.find('img'))
  for(let img of imgs) {
    let image = findByUrl(Utils.removeProtocolHead(img.attribs.src), images)
    img.attribs.alt = image.alt
    img.attribs.title = image.title
    img.attribs.width = img.attribs['data-w'] = image.width
    img.attribs.height = img.attribs['data-h'] = image.height
    img.attribs.src = '//c.diaox2.com/cms/diaodiao/assets/pixel.gif'
    img.attribs['data-big'] = '//' + image.url
    img.attribs['data-src'] = img.attribs['data-big'] + (image.extension_name == 'gif' ? '@768w_1l' : '')
    $(img).addClass('lazy')
  }
  return container.html()
}
