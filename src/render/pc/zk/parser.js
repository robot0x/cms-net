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
    // this.allCardReg = /```card(.|\r|\n)+?```/ig
    // this.allCardReg = /```card(.|\s)+?```/ig
    this.allCardReg = /```card[\s\S]+?```/ig
    // this.indexReg = /\`\`\`card\s+(\w+)\`\`\`/
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
    renderer.code = (text, type) => {
      const { idReg, titleReg, descReg, imageReg, markdown, allCardReg } = this
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
      /**
       * 有购买链接：
       *  1. 先拿文章的
       */
      if (/card/i.test(type)) {
        const allCardMarkdown = markdown.match(allCardReg)
        let index = -1
        let len = allCardMarkdown.length
        for (let i = 0; i < len; i++) {
          let md = allCardMarkdown[i]
          if (md.indexOf(text) !== -1) {
            index = i
            break
          }
        }
        const item = `
        <li class="goodthing f-l">
          <a target="_blank" href="//www.diaox2.com/article/${id}.html" data-type="goodthing">
            <div class="img-container">
              <img onload="adjust(this);" src="//${image}" data-w="596" data-h="486">
            </div>
            <div class="goodthing-highlight">
              <h2><div>${title}</div></h2>
              <p>${desc}</p>
            </div>
          </a>
        </li>`
        if (index === 0) {
          return `
            <ul class="goodthing-list clearfix">
              ${item}
          `
        } else if (index === len - 1) {
          return `
              ${item}
            </ul>
          `
        } else {
          return item
        }
      } else if (/zk/i.test(type)) {
        return `
          <div class="article-banner">
            <div class="article-banner-container">
              <ul class="banner-list loading">
                <li><img src="//${image}" data-w="640" data-h="416" alt="" width="640" height="416"></li>
              </ul>
            </div>
          </div>
          <p class="zk-title">
          ${desc}
          </p>
          <a name="goodthing"></a>
          <ul class="zs-box">
            <li>
              <a href="javascript:;">
                <i class="icon icon-s"></i>
                <span class="a-fav">...</span>
              </a>
            </li>
            <li>
              <a href="javascript:;">
                <i class="icon icon-z"></i>
                <span class="a-up">..</span>
              </a>
            </li>
          </ul>`
      } else {
        return ''
      }
    }
    super.setRenderer(renderer)
  }
}

module.exports = ZKParser
