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
class ZTParser extends Parser {
  constructor () {
    super()
    //*****************************************自定义markdown语法解析*****************************************
    const renderer = super.getRenderer()
// ```zt
//     title: 三百元以下的情趣小厨具
//     desc: 无论是单身狗还是一对汪，一年之中总有那么几个周末想窝在家中，望望天花板，剥剥手指甲，吃吃小食，看看电视，度过一天。所以啊，小食很重要，样样不能少！怎么做？且听我慢慢道来。
// ```
// ```card
    // title: 关爱啤酒，更关爱打泡的你
    // desc: 男生嘛，肯定要来瓶啤酒潇洒一下，尤其是那口感细腻的啤酒花，绝对不能少。别再依靠土掉渣的晃动酒瓶子，来弄点儿少得可怜的啤酒花。试试电动打泡器，分分钟尽情享用爽口的啤酒。
//     image: ![](//content.image.alimmdn.com/cms/sites/default/files/20150730/goodthing/BeerCover.jpg)
// ```
    const delimiter = '<hr class="articlesep">'
    renderer.code = (text, type) => {
      const idReg = /id[:：]\s*(\d+)\s*title[:：]/
      const titleReg = /title[:：]\s*(.+)\s*desc[:：]/
      const descReg = /desc[:：]\s*(.+)\s*(?:image[:：])?/
      const imageReg = /image[:：]\s*!\[.*\]\((?:https?)?(?:\/\/)?(.+)\s*\)\s*/
      let id = text.match(idReg)
      let title = text.match(titleReg)
      let desc = text.match(descReg)
      let image = text.match(imageReg)
      if(Utils.isValidArray(id)){
        id = id[1]
      }
      if(Utils.isValidArray(title)){
        title = title[1]
      }
      if(Utils.isValidArray(desc)){
        desc = desc[1]
      }
      if(Utils.isValidArray(image)){
        image = image[1]
      }
      try {
        // console.log(type)
        // console.log('title:', title)
        // console.log('desc:', desc)
        // console.log('image:', image)
        if(/card/i.test(type)) {
          // console.log('48: if')
          return  `<div class="articlecard ztcard" data-href="//c.diaox2.com/view/app/?m=show&id=${id}">
                      <div class="ztleft">
                        <img src="//${image}">
                      </div>
                      <div class="ztright">
                        <p class="p1">${title}</p>
                        <p class="p2">${desc}</p>
                        <p class="p3" data-id="${4294967297 * id}">阅读 ...</p>
                      </div>
                    </div>
                    ${delimiter}
                    `
        } else if (/zt/i.test(type)){
          // console.log('62: else')
          return `<div class="headdesc bottomshadow zthead">
                    <h2>${title}</h2>
                    <p>${desc || ''}</p>
                  </div>
                  <div class="grayband"></div>`
        } else {
          // console.log('70: default')
          return ''
        }
      } catch (e) {
        console.log(e)
        return ''
      }
    }
    super.setRenderer(renderer)
  }
  
  setBuylinks (buylinks) {
    this.buylinks = buylinks
    return this
  }
}

module.exports = ZTParser
