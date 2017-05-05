const Parser = require('../../../parser')
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
    //*****************************************自定义markdown语法解析*****************************************
    const renderer = super.getRenderer()
    renderer.blockquote = text => `
      <div class="quotebox">
      <i class="box-top"></i>
      <div class="box-inner">
        ${text}
      </div>
      </div>
      `
    renderer.heading = (text, level) => {
      return `<h${level}>${text}</h${level}>`
    }
    renderer.codespan = text => `<p class="lift">${text}</p>`
    /**
     * 在段落内，包含行内标签
     *  行内标签包括：
     *   1. a
     *   2. stromg
     *   3. em
     *   4. del
     *   5. span
     */
    renderer.link = (href, title, text) => {
      if (/^\d+$/.test(href)) {
        href = `//c.diaox2.com/view/app/?m=show&id=${href}`
      }
      return `<a target="_blank" href="${href}">${text || href}</a>`
    }
    super.setRenderer(renderer)
  }
}

module.exports = ShowParser
