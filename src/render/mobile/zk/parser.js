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
    this.idReg = /id[:：]\s*(\d+)\s*/
    this.descReg = /desc[:：]\s*(.+)\s*/
    // zkdesc 无论是单身狗还是一对汪，一年之中总有那么几个周末想窝在家中，望望天花板，剥剥手指甲，吃吃小食，看看电视，度过一天。所以啊，小食很重要，样样不能少！怎么做？且听我慢慢道来。
    // ```zkarticle
    //     id: 2717
    //     desc: 男生嘛，肯定要来瓶啤酒潇洒一下，尤其是那口感细腻的啤酒花，绝对不能少。别再依靠土掉渣的晃动酒瓶子，来弄点儿少得可怜的啤酒花。试试电动打泡器，分分钟尽情享用爽口的啤酒。
    // ```
    // ```zkarticle
    //     id: 2197
    //     desc: 女生嘛，即便宅在家里，还是要注意各种营养。买几袋鲜奶，用上酸奶机，自己做个天然酸奶。周末便能窝在沙发上，边喝酸奶边看真人秀啦！
    // ```
    const delimiter = '<div class="headgrayband"></div>'
    renderer.paragraph = content => {
      const zkdescReg = /^zkdesc\s+/i
      const { title, cover } = this
      let ret = ''
      // title我们约定，如果里面有2个空格，则替换成换行。例如 "给你的小长假整齐行李！  旅行收纳大合集" => ""给你的小长假整齐行李！<br>旅行收纳大合集"
      // 加上@768_1l 减小图片大小，经测试专刊页可以减少至少10%的下载量
      if (zkdescReg.test(content)) {
        ret = `<div class="bottomshadow card" id="head">
                  <div>
                      <div class="mask" style="width: 720px; height: 468px;"></div>
                      <img class="direct" src="${Utils.addProtocolHead(Utils.addImageOfShowPageAliImageSuffix(cover.url))}" data-w="640" data-h="416" style="width: 720px; height: 468px;">
                      <div id="headtitle"><p>${title.replace(/ {2}/, '<br>')}</p></div>
                  </div>
                  <p class="headdesc">${content.replace(zkdescReg, '')}</p>
              </div>
              ${delimiter}`
      }
      return ret
    }
    renderer.code = (text, type) => {
      const { idReg, descReg } = this
      let id = text.match(idReg)
      let desc = text.match(descReg)
      if (Utils.isValidArray(id)) {
        id = id[1]
      }
      if (Utils.isValidArray(desc)) {
        desc = desc[1]
      }
      // console.log('title:', title)
      // console.log('desc:', desc)
      // console.log('image:', image)
      /**
       * 有购买链接：
       *  1. 先拿文章的
       */
      if (/zkarticle/i.test(type)) {
        let buylink = this.getBuylinkById(id)
        let ret = `<div class="bottomshadow card goodthing" data-href="https://c.diaox2.com/view/app/?m=show&id=${id}">
                <div class="wrapper">
                        <div class="img">
                          <img class="direct" src="" data-w="596" data-h="486" style="width: 672px; height: 547px;">
                        </div>
                        </div>
                        <p class="title"></p>
                        <p class="desc">${desc}</p>
                        <div class="pseudoB"><p>查看详情</p><span data-link="${buylink}">立即购买</span></div>
                    </div>
                    ${delimiter}`
        if (!buylink) {
          ret = `<div class="bottomshadow card goodthing" data-href="https://c.diaox2.com/view/app/?m=show&id=${id}">
                <div class="wrapper">
                        <div class="img">
                          <div class="mask" style="width: 672px; height: 529px;"></div>
                          <img class="direct" src="" data-w="596" data-h="486" style="width: 672px; height: 547px;">
                          <p class="mask-title"></p>
                        </div>
                        </div>
                        <p class="desc">${desc}</p>
                        <div class="pseudoB"><p>查看详情</p></div>
                    </div>
                    ${delimiter}`
        }
        return ret
      }
    }
    super.setRenderer(renderer)
  }
  setTitle (title) {
    this.title = title
    return this
  }
  setTitleex (titleex) {
    this.titleex = titleex
    return this
  }
  setIds (ids) {
    this.ids = ids
    return this
  }
  setCover (cover) {
    this.cover = cover
    return this
  }
  setBuylinks (buylinks) {
    this.buylinks = buylinks
    return this
  }

  getBuylinkById (id) {
    let { buylinks } = this
    if (!buylinks) return
    for (let buylink of buylinks) {
      if (buylink.cid == id) {
        return buylink.link
      }
    }
    return null
  }
}

module.exports = ZKParser
