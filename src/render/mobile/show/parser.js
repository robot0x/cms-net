const Parser = require('../../../parser')
const Utils = require('../../../utils/Utils')
// const request = require('request')
// const Promise = require('bluebird')
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
    // renderer.heading = (text, level) => {
    //   return `<h${level}>${text}</h${level}>`
    // }
    // function rendeSku (content) {
    //   const idReg = /id[:：]\s*(\d+)\s*title[:：]/
    //   const titleReg = /title[:：]\s*(.+)\s*price[:：]/
    //   const priceReg = /price[:：]\s*(.+)\s*image[:：]/
    //   const imageReg = /image[:：]\s*!\[.*\]\((?:https?)?(?:\/\/)?(.+)\s*\)\s*/
    //   let id = content.match(idReg)
    //   let title = content.match(titleReg)
    //   let price = content.match(priceReg)
    //   let image = content.match(imageReg)
    //   if (Utils.isValidArray(id)) {
    //     id = id[1]
    //   }
    //   if (Utils.isValidArray(title)) {
    //     title = title[1]
    //   }
    //   if (Utils.isValidArray(price)) {
    //     price = price[1]
    //   }
    //   if (Utils.isValidArray(image)) {
    //     image = image[1]
    //   }
    //   // @200w_200h_1e%7C200x200-5rc
    //   return `<div class="articlecard bottomshadow revarticlecard" data-href="//c.diaox2.com/view/app/sku/${id}.html">
    //            <img class="articleimg" src="//${Utils.addAliImageSuffix(image)}">
    //            <span class="articletitle">${title}</span>
    //            <span class="brand">${price}</span>
    //            <div class="buy-button-area">
    //             <button class="buy-button">
    //               <span>立即购买</span>
    //             </button>
    //             </div>
    //           </div>`
    // }
    // renderer.code = (content, type) => {
    //   let ret = ''
    //   switch (type) {
    //     case 'sku':
    //       ret = rendeSku(content)
    //       break
    //   }
    //   console.log(ret)
    //   return ret
    // }
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
      const edsReg = /^eds\s+/i
      const edsdescReg = /^edsdesc\s+/i
      const liftReg = /^lift\s+/i
      const lift2Reg = /^lift2\s+/i
      const skuReg = /^sku\s+/i
      let ret = ''
      if (isAnchor) {
        ret = `<p id="${anchor}">${text}</p>`
      } else if (edsReg.test(text)) {
        ret = `<p class="editorhead">${text.replace(edsReg, '')}</p>`
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
      let reg = /^\d+(#\w+)?$/
      let match = href.match(reg)
      let openMethod = '_blank'
      // 1234#youdiao
      if (match) {
        let hash = match[1]
        if (hash) {
          href = hash
          openMethod = '_self'
        } else {
          href = `//c.diaox2.com/view/app/?m=show&id=${href}`
        }
      }
      // console.log(href)
      return `<a target="${openMethod}" href="${href}">${text || href}</a>`
    }

    // renderer.code = (text, type) => {
    //   if(/sku/i.test(type) && text && (text = text.trim()) && /\d+/.test(text)){
    //     // console.log('这是一篇sku, sid为:', text)
    //     // return `这是一篇sku, sid为:${text}`
    //     return new Promise((resolve, reject) => {
    //       resolve(`这是一篇sid为${text}的sku`)
    //     })
    //   }
    // }
    // super.setOptions({ promise: true })
    // super.setOptions({
    //   promise: true,
    //   async highlight (sid, type, callback) {
    //      if(/sku/i.test(type) && sid && (sid = sid.trim()) && /\d+/.test(sid)){
    //       //  return callback(null, '<p id="hello">你好</p>')
    //       const result = await Promise.promisify(request)(`http://s5.a.dx2rd.com:3000/v1/getsimplesku/${sid}`)
    //       let {state, data} = JSON.parse(result.body)
    //       if(state !== 'SUCCESS') {
    //         return ''
    //         // throw Error('调用getfullsku接口失败')
    //       }
    //       console.log('data:', data);
    //       let {title, price_str, images} = data
    //       let image = Utils.getFirst(images)
    //       if(!image) return ''
    //       return callback(null, `
    //         <div class="articlecard bottomshadow revarticlecard" data-href="//c.diaox2.com/view/app/sku/${sid}.html">
    //           <img class="articleimg" src="${Utils.addAliImageSuffix(image.url)}">
    //           <span class="articletitle">${title}</span>
    //           <span class="brand">${price_str}</span>
    //           <div class="buy-button-area">
    //             <button class="buy-button"><span>立即购买</span></button>
    //           </div>
    //         </div>`)
    //     }
    //   }
    // })
    super.setRenderer(renderer)
  }
}

module.exports = ShowParser
