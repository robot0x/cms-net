const Parser = require('../../../parser')
const request = require('request')
const Promise = require('bluebird')
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
