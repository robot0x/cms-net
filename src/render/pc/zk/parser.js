// const Utils = require('../../../utils/Utils')
/**
 * CMS markdown 解析器
 * 读取文章原始markdown文本
 * 然后解析成相应的数据片段或html片段
 *  1、文章数据片段
 *    目前微信小程序在用这个接口，将来app内也会用
 *    线上格式：https://c.diaox2.com/view/app/wechat/1234.html
 *    格式约定：https://github.com/liaoruoxue/pm2rd/issues/30
 *  2、根据解析出来的数据片段渲染成一段html片段
 * 不用marked了，因为在实际运用过程中发现如果多个 ```zkarticle``` 连在一起，时不时的会出bug，不是太稳定
 */
class ZKParser {
  getHTML (title, titleex, zkdesc, cover, metas, ids) {
    let html = `<h1 class="article-title">
                  <p>${title}</p>
                  ${titleex ? `<a href="#goodthing" class="goodthing-count">${titleex}</a>` : ''}
                </h1>
                <div class="article-banner">
                 <div class="article-banner-container">
                    <ul class="banner-list loading">
                      <li><img src="//${cover.url}" data-w="640" data-h="416" alt="" width="640" height="416"></li>
                    </ul>
                  </div>
                </div>
                <p class="zk-title">
                 ${zkdesc}
                </p>
                <a id="goodthing" href="javascript:void(0);"></a>
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
                      <span class="a-up">...</span>
                    </a>
                  </li>
                </ul>
                `
    html += '<ul class="goodthing-list clearfix">'
    for (let id of ids) {
      let meta = this.findMetaById(metas, id)
      if (!meta) continue
      html += `<li class="goodthing f-l">
          <a target="_blank" href="//www.diaox2.com/article/${id}.html" data-type="goodthing">
            <div class="img-container">
              <img onload="adjust(this);"  data-w="596" data-h="486">
            </div>
            <div class="goodthing-highlight">
              <h2><div></div></h2>
              <p>${meta.desc}</p>
            </div>
          </a>
        </li>`
    }
    html += '</ul>'
    return html
  }
  findMetaById (metas, id) {
    for (let meta of metas) {
      if (id == meta.nid) {
        return meta
      }
    }
  }
}

module.exports = ZKParser
