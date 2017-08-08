const Parser = require('../../../parser')
const Utils = require('../../../utils/Utils')
/**
 * CMS markdown 解析器
 * 读取文章原始markdown文本
 * 然后解析成相应的数据片段或html片段
 *  1、文章数据片段
 *    目前微信小程序在用这个接口，将来app内也会用
 *    线上格式：https://c.diaox2.com/view/app/wechat/1234.html
 *    格式约定：https://github.com/liaoruoxue/pm2rd/issues/30
 *  2、根据解析出来的数据片段渲染成一段html片段
 */
class ShowParser extends Parser {
  constructor () {
    super()
    //* ****************************************自定义markdown语法解析*****************************************
    const renderer = super.getRenderer()
    renderer.blockquote = text =>
      `
      <div class="quotebox">
      <i class="box-top"></i>
      <div class="box-inner">
        ${text}
      </div>
      </div>
      `
    renderer.heading = (content, level) => {
      const {isAnchor, anchor, text} = Utils.anchorHandler(content)
      let ret = ''
      if (isAnchor) {
        // console.log('ShowParser.anchor:', anchor)
        ret = `<h${level} id="${anchor}">${text}</h${level}>`
      } else {
        ret = `<h${level}>${text}</h${level}>`
      }
      return ret
    }
    renderer.paragraph = content => {
      const { isAnchor, anchor, text } = Utils.anchorHandler(content)
      const edsReg = /^eds\s*?(?!desc)/i
      const edsdescReg = /^edsdesc\s+/i
      // 和移动站的恰好是反过来的
      const liftReg = /^lift\s+/i
      const lift2Reg = /^lift2\s+/i
      const skuReg = /^sku\s+/i
      let ret = ''
      if (isAnchor) {
        ret = `<p id="${anchor}">${text}</p>`
      } else if (edsReg.test(text)) {
        let edscontent = text.replace(edsReg, '') || '小编说'
        ret = `<p class="editorhead">${edscontent}</p>`
      } else if (edsdescReg.test(text)) {
        ret = `<p class="editorcontent">${text.replace(edsdescReg, '')}</p>`
      } else if (lift2Reg.test(text)) {
        ret = `<p class="lift2">${text.replace(lift2Reg, '')}</p>`
      } else if (liftReg.test(text)) {
        ret = `<p class="lift"><em>${text.replace(liftReg, '')}</em></p>`
      } else if (skuReg.test(text)) {
        ret = ''
      } else {
        ret = `<p>${text}</p>`
      }
      return ret
    }
    // renderer.heading = (text, level) => {
    //   return `<h${level}>${text}</h${level}>`
    // }
    // renderer.codespan = text => `<p class="lift">${text}</p>`
    /**
     * 在段落内，包含行内标签
     *  行内标签包括：
     *   1. a
     *   2. stromg
     *   3. em
     *   4. del
     *   5. span
     */
    renderer.link = (href, title = '', text = '') => {
      if (!href || !href.trim()) return ''
      const prefix = '//www.diaox2.com/article'
      // 处理a标签内含有图片的语法 start
      let imgReg = /\s*img:\s*/
      let imgUrl = ''
      if (imgReg.test(href)) {
        [href, imgUrl] = href.split(imgReg)
        text += `<img src="${imgUrl}">`
      }
      let openMethod = '_blank'
      let hashReg = /^(\d+)?(#.+)$/
      let match = href.match(hashReg)
      // let hash = null
      // 处理a标签内含有图片的语法 end
      if (/^\d+$/.test(href)) {
        // 处理测评集合页 [这是测评集合页的链接](7216)
        if (href == 7216) {
          href = '#'
        } else {
          if (href.indexOf('#') !== -1) {
            let [id, anch] = href.split('#')
            href = `${prefix}/${id}.html#${anch}`
          } else {
            href = `${prefix}/${href}.html`
          }
        }
        openMethod = '_self'
      } else if (/pcollection/i.test(href)) { // [这是测评集合页的链接](pcollection)
        // href = `${prefix}/?m=pcollection`
        href = '#'
        openMethod = '_self'
      } else if (match) {
        // 9833#youdiao 或 #youdiao
        // href = hash
        // 9833#youdiao
        if (match[1]) {
          let [id, hash] = match[0].split('#')
          href = `${prefix}/${id}.html#${hash}`
        } else {
          href = match[2]
        }
        openMethod = '_self'
      }
      return `<a target="${openMethod}" href="${href}">${text || href}</a>`
    }
    // renderer.link = (href, title, text) => {
    //   if (/^\d+$/.test(href)) {
    //     href = `//c.diaox2.com/view/app/?m=show&id=${href}`
    //   }
    //   return `<a target="_blank" href="${href}">${text || href}</a>`
    // }
    super.setRenderer(renderer)
  }
}

module.exports = ShowParser
