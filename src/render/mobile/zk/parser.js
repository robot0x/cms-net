// const Parser = require('../../../parser')
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
 *  不用marked了，因为在实际运用过程中发现如果多个 ```zkarticle``` 连在一起，时不时的会出bug，不是太稳定
 */
// class ZKParser extends Parser {
class ZKParser {
  getHTML (title, titleex, zkdesc, cover, metas, ids) {
    const delimiter = '<div class="headgrayband"></div>'
    let html = `<div class="bottomshadow card" id="head">
                  <div>
                      <div class="mask" style="width: 720px; height: 468px;"></div>
                      <img class="direct" src="${Utils.addProtocolHead(Utils.addImageOfShowPageAliImageSuffix(cover.url))}" data-w="640" data-h="416" style="width: 720px; height: 468px;">
                      <div id="headtitle"><p>${title.replace(/ {2}/, '<br>')}</p></div>
                  </div>
                  <p class="headdesc">${zkdesc}</p>
              </div>
              ${delimiter}`
    for (let id of ids) {
      let meta = this.findMetaById(metas, id)
      if (!meta) continue
      let { nid, desc, has_buylink, buylink } = meta
      if (has_buylink) { // eslint-disable-line
        html += `<div class="bottomshadow card goodthing" data-href="https://c.diaox2.com/view/app/?m=show&id=${nid}">
                <div class="wrapper">
                        <div class="img">
                          <img class="direct" src="">
                        </div>
                        </div>
                        <p class="title"></p>
                        <p class="desc">${desc}</p>
                        <div class="pseudoB"><p>查看详情</p><span data-link="${Utils.convertSkuUrl(buylink, nid)}">立即购买</span></div>
                    </div>
                    ${delimiter}`
      } else {
        html += `<div class="bottomshadow card goodthing" data-href="https://c.diaox2.com/view/app/?m=show&id=${nid}">
                <div class="wrapper">
                        <div class="img">
                          <div class="mask"></div>
                          <img class="direct" src="">
                          <p class="mask-title"></p>
                        </div>
                        </div>
                        <p class="desc">${desc}</p>
                        <div class="pseudoB"><p>查看详情</p></div>
                    </div>
                    ${delimiter}`
      }
    }
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
