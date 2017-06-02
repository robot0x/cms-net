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
    this.header = ''
    this.body = ''
    this.idReg = /id[:：]\s*(\d+)\s*/
    this.descReg = /desc[:：]\s*(.+)\s*/
    // this.allCardReg = /```zkarticle[\s\S]+?```/ig
    // this.idReg = /id[:：]\s*(\d+)\s*title[:：]/
    // this.titleReg = /title[:：]\s*(.+)\s*desc[:：]/
    // this.descReg = /desc[:：]\s*(.+)\s*image[:：]/
    // this.imageReg = /image[:：]\s*!\[.*\]\((?:https?)?(?:\/\/)?(.+)\s*\)\s*/
    // this.indexReg = /\`\`\`card\s+(\w+)\`\`\`/
    // zkdesc 无论是单身狗还是一对汪，一年之中总有那么几个周末想窝在家中，望望天花板，剥剥手指甲，吃吃小食，看看电视，度过一天。所以啊，小食很重要，样样不能少！怎么做？且听我慢慢道来。
    // ```zkarticle
    //     id: 2717
    //     desc: 男生嘛，肯定要来瓶啤酒潇洒一下，尤其是那口感细腻的啤酒花，绝对不能少。别再依靠土掉渣的晃动酒瓶子，来弄点儿少得可怜的啤酒花。试试电动打泡器，分分钟尽情享用爽口的啤酒。
    // ```
    // ```zkarticle
    //     id: 2197
    //     desc: 女生嘛，即便宅在家里，还是要注意各种营养。买几袋鲜奶，用上酸奶机，自己做个天然酸奶。周末便能窝在沙发上，边喝酸奶边看真人秀啦！
    // ```
    renderer.paragraph = content => {
      const zkdescReg = /^zkdesc\s+/i
      const { title, cover, titleex } = this
      if (zkdescReg.test(content)) {
        this.header += `<h1 class="article-title">
                  <p>${title}</p>
                  <a href="#goodthing" class="goodthing-count">${titleex}</a>
                </h1>
                <div class="article-banner">
                 <div class="article-banner-container">
                    <ul class="banner-list loading">
                      <li><img src="//${cover.url}" data-w="640" data-h="416" alt="" width="640" height="416"></li>
                    </ul>
                  </div>
                </div>
                <p class="zk-title">
                 ${content.replace(zkdescReg, '')}
                </p>
                `
      }
      return this.header
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
      let ret = ''
      if (/zkarticle/i.test(type)) {
        ret = `<li class="goodthing f-l">
          <a target="_blank" href="//www.diaox2.com/article/${id}.html" data-type="goodthing">
            <div class="img-container">
              <img onload="adjust(this);"  data-w="596" data-h="486">
            </div>
            <div class="goodthing-highlight">
              <h2><div></div></h2>
              <p>${desc}</p>
            </div>
          </a>
        </li>
          `
      }
      this.body += ret
      return ret
    }
    // renderer.code = (text, type) => {
    //   const { article } = this
    //   /**
    //    * 有购买链接：
    //    *  1. 先拿文章的
    //    */
    //   // let ids = Object.keys(article)
    //   let ret = ''
    //   ret += `
    //     <li class="goodthing f-l">
    //       <a target="_blank" href="//www.diaox2.com/article/${id}.html" data-type="goodthing">
    //         <div class="img-container">
    //           <img onload="adjust(this);"  data-w="596" data-h="486">
    //         </div>
    //         <div class="goodthing-highlight">
    //           <h2><div></div></h2>
    //           <p>${desc}</p>
    //         </div>
    //       </a>
    //     </li>`
    //   return ret
    // }
    // renderer.code = (text, type) => {
    //   const { idReg, descReg } = this
    //   let id = text.match(idReg)
    //   let desc = text.match(descReg)
    //   if (Utils.isValidArray(id)) {
    //     id = id[1]
    //   }
    //   if (Utils.isValidArray(desc)) {
    //     desc = desc[1]
    //   }
    //   // console.log('title:', title)
    //   // console.log('desc:', desc)
    //   // console.log('image:', image)
    //   /**
    //    * 有购买链接：
    //    *  1. 先拿文章的
    //    */
    //   if (/zkarticle/i.test(type)) {
    //     return `<div class="bottomshadow card goodthing" data-href="//c.diaox2.com/view/app/?m=show&id=${id}">
    //             <div class="wrapper">
    //                     <div class="img">
    //                       <img class="direct" src="" data-w="596" data-h="486" style="width: 672px; height: 547px;">
    //                     </div>
    //                     </div>
    //                     <p class="title"></p>
    //                     <p class="desc">${desc}</p>
    //                 </div>
    //                `
    //   }
    // }
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
  setArticle (article) {
    this.article = article
    return this
  }
  setCover (cover) {
    this.cover = cover
    return this
  }
}

module.exports = ZKParser
