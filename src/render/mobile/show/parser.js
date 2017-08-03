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
      let { isAnchor, anchor, text } = Utils.anchorHandler(content)
      // 处理折叠的内容
      let decollapseReg = / ={3}(\w+)$/
      let match = text.match(decollapseReg)
      let collapse = ''
      if (match) {
        text = text.replace(decollapseReg, '')
        collapse = match[1]
      }
      let ret = ''
      if (isAnchor) {
        if (collapse) {
          ret = `<h${level} id="${anchor}" data-collapse="${collapse}">${text}</h${level}>`
        } else {
          ret = `<h${level} id="${anchor}">${text}</h${level}>`
        }
      } else {
        if (collapse) {
          ret = `<h${level} data-collapse="${collapse}">${text}</h${level}>`
        } else {
          ret = `<h${level}>${text}</h${level}>`
        }
      }
      return ret
    }
    renderer.paragraph = content => {
      const { isAnchor, anchor, text } = Utils.anchorHandler(content)
      const edsReg = /^eds\s*?(?!desc)/i
      const edsdescReg = /^edsdesc\s+/i
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
        let sid = text.replace(skuReg, '')
        if (sid && (sid = sid.trim()) && /^\d+$/.test(sid)) {
          ret = `
          <div class="articlecard bottomshadow revarticlecard" data-sid=${sid} data-href="//c.diaox2.com/view/app/sku/${sid}.html">
            <img class="articleimg" src="">
            <span class="articletitle"></span>
            <span class="brand"></span>
            <div class="buy-button-area">
              <button class="buy-button">
                <span>立即购买</span>
              </button>
            </div>
          </div>`
        }
      } else {
        ret = `<p>${text}</p>`
      }
      return ret
    }
    // renderer.paragraph = (content) => {
    //   const {isAnchor, anchor, text} = Utils.anchorHandler(content)
    //   let ret = ''
    //   if (isAnchor) {
    //     ret = `<p id="${anchor}">${text}</p>`
    //   } else {
    //     ret = `<p>${text}</p>`
    //   }
    //   return ret
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
     * a标签比较复杂，共有下列几种情况要处理：
     *   1、a标签引用外部链接                          [](http://www.baidu.com)
     *   2、a标签引用文章id                            [](1120)
     *   3、a标签为锚点                                [](#youdiao) OR [](1120#youdiao)
     *   4、a标签引用测评集合页（7216 or pcollection）  [](7216) OR [](pcollection)
     *   5、a标签内部有img标签                         [](可能为上面某种形式 img: http://test.com/a.jpg)
     *   测试：
     *    输入 '' => ''
     *    输入 http://www.baidu.com  => http://www.baidu.com
     *    输入 1120                  => //c.diaox2.com/view/app/?m=show&id=1120
     *    输入 1120#youdiao          => //c.diaox2.com/view/app/?m=show&id=1120#youdiao
     *    输入 1120#有调             => //c.diaox2.com/view/app/?m=show&id=1120#有调
     *    输入 #有调                 => #有调
     *    输入 7216                  => //c.diaox2.com/view/app/?m=pcollection
     *    输入 pcollection           => //c.diaox2.com/view/app/?m=pcollection
     */
    renderer.link = (href, title = '', text = '') => {
      if (!href || !href.trim()) return ''
      const prefix = '//c.diaox2.com/view/app'
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
          href = `${prefix}/?m=pcollection`
        } else {
          href = `${prefix}/?m=show&id=${href}`
        }
      } else if (/pcollection/i.test(href)) { // [这是测评集合页的链接](pcollection)
        href = `${prefix}/?m=pcollection`
      } else if (match) {
        // 9833#youdiao 或 #youdiao
        // href = hash
        // 9833#youdiao
        if (match[1]) {
          href = `${prefix}/?m=show&id=${match[0]}`
        } else {
          href = match[2]
        }
        openMethod = '_self'
      }
      return `<a target="${openMethod}" href="${href}">${text || href}</a>`
    }
    super.setRenderer(renderer)
  }
}

module.exports = ShowParser
