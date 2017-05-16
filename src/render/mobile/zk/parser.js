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
class ZKParser extends Parser {
  constructor () {
    super()
    //* ****************************************自定义markdown语法解析*****************************************
    const renderer = super.getRenderer()
    this.idReg = /id[:：]\s*(\d+)\s*title[:：]/
    this.titleReg = /title[:：]\s*(.+)\s*desc[:：]/
    this.descReg = /desc[:：]\s*(.+)\s*image[:：]/
    this.imageReg = /image[:：]\s*!\[.*\]\((?:https?)?(?:\/\/)?(.+)\s*\)\s*/
    // ```zk
    //     title: 三百元以下的情趣小厨具
    //     desc: 无论是单身狗还是一对汪，一年之中总有那么几个周末想窝在家中，望望天花板，剥剥手指甲，吃吃小食，看看电视，度过一天。所以啊，小食很重要，样样不能少！怎么做？且听我慢慢道来。
    //     image: ![](//content.image.alimmdn.com/cms/sites/default/files/20150903/zk/okiki.jpg)
    // ```
    // ```card
    // title: 关爱啤酒，更关爱打泡的你
    // desc: 男生嘛，肯定要来瓶啤酒潇洒一下，尤其是那口感细腻的啤酒花，绝对不能少。别再依靠土掉渣的晃动酒瓶子，来弄点儿少得可怜的啤酒花。试试电动打泡器，分分钟尽情享用爽口的啤酒。
    //     image: ![](//content.image.alimmdn.com/cms/sites/default/files/20150730/goodthing/BeerCover.jpg)
    // ```
    const delimiter = '<div class="headgrayband"></div>'
    renderer.code = (text, type) => {
      const { idReg, titleReg, descReg, imageReg } = this
      let id = text.match(idReg)
      let title = text.match(titleReg)
      let desc = text.match(descReg)
      let image = text.match(imageReg)
      if (Utils.isValidArray(id)) {
        id = id[1]
      }
      if (Utils.isValidArray(title)) {
        title = title[1]
      }
      if (Utils.isValidArray(desc)) {
        desc = desc[1]
      }
      if (Utils.isValidArray(image)) {
        image = image[1]
      }
      // console.log('title:', title)
      // console.log('desc:', desc)
      // console.log('image:', image)
      /**
       * 有购买链接：
       *  1. 先拿文章的
       */
      if (/card/i.test(type)) {
        // 专刊页上的购买链接，如果是sku页，则必须用 /sku/longid/sid.html这种形式
        let buylink =
          this.getBuylinkById(id) || `//c.diaox2.com/view/app/?m=buy&aid=${id}`
        return `<div class="bottomshadow card goodthing" data-href="//c.diaox2.com/view/app/?m=show&id=${id}">
                <div class="wrapper">
                        <div class="img">
                          <img class="direct" src="//${image}" data-w="596" data-h="486" style="width: 672px; height: 547px;">
                        </div>
                        </div>
                        <p class="title">${title}</p>
                        <p class="desc">${desc}</p>
                        <div class="pseudoB"><p>查看详情</p><span data-link="${buylink}">立即购买</span></div>
                    </div>
                    ${delimiter}
                    `
      } else if (/zk/i.test(type)) {
        return `<div class="bottomshadow card" id="head">
                  <div>
                      <div class="mask" style="width: 720px; height: 468px;"></div>
                      <img class="direct" src="//${image}" data-w="640" data-h="416" style="width: 720px; height: 468px;">
                      <div id="headtitle"><p>${title}</p></div>
                  </div>
                  <p class="headdesc">${desc}</p>
              </div>
              ${delimiter}
              `
      } else {
        return ''
      }
    }
    super.setRenderer(renderer)
  }

  setBuylinks (buylinks) {
    this.buylinks = buylinks
    return this
  }

  getBuylinkById (id) {
    let { buylinks } = this
    for (let buylink of buylinks) {
      if (buylink.cid == id) {
        return buylink.link
      }
    }
    return null
  }
}

module.exports = ZKParser
