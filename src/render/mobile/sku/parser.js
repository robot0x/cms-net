// const Parser = require('../../../parser')
const Utils = require('../../../utils/Utils')
class SkuParser {
  setSales (sales) {
    this.sales = sales
    return this
  }
  getRevarticleHTML (metas) {
    // console.log('metas:', metas)
    if (!Array.isArray(metas)) {
      metas = [metas]
    }
    let html = ''
    for (let meta of metas) {
      let { nid, thumb_image_url, title } = meta
      html += `
      <div class="articlecard bottomshadow revarticlecard" data-href="//c.diaox2.com/view/app/?m=show&id=${nid}">
        <img class="articleimg" src="${thumb_image_url}">
        <span class="articletitle">${(title[0] || '').replace(/ {2}/, '')}</span>
        <span class="articleread unknown" data-id="${Utils.toLongId(nid)}">阅读 ...</span>
      </div>
      `
    }
    return html
  }
  getHTML (sales = this.sales) {
    let html = ''
    /**
     * 策略：
     *  1. 优先展示精品购链接，有精品购链接不展示其他链接
     *  2. 没有精品购链接，展示第三方电商链接
    */
    let shopGos = []
    let others = []
    for (let sale of sales) {
      let type = sale.type
      // 如果明确是other，则为第三个链接，如果没有type属性，默认认为是第三方链接
      // 已经区分sale类型是后面做的，原来老的没有指定type的sale默认认为是other
      if (type === 'other' || !type) {
        others.push(sale)
      } else if (type === 'shop_go') {
        shopGos.push(sale)
      }
    }
    if (shopGos.length > 0) {
      sales = shopGos
    } else if (others.length > 0) {
      sales = others
    }
    for (let sale of sales) {
      let { mart, price, intro, link_m_cps, link_pc_cps, link_m_raw, link_pc_raw, type } = sale
      let link = link_m_cps || link_pc_cps || link_m_raw || link_pc_raw || ''
      let icon = 'default.png'
      if (/tmall|天猫/.test(mart) || link.indexOf('tmall.com') !== -1) {
        icon = 'tmall.png'
      } else if (link.indexOf('taobao.com') !== -1) {
        icon = 'tb.png'
      } else if (link.indexOf('jd.com') !== -1) {
        icon = 'jd.png'
      } else if (link.indexOf('amazon.cn') !== -1) {
        icon = 'amazoncn.png'
      } else if (link.indexOf('amazon.jp') !== -1) {
        icon = 'amazonjp.png'
      } else if (link.indexOf('shopbop.com') !== -1) {
        icon = 'shopbop.png'
      } else if (link.indexOf('rakuten.com') !== -1) {
        icon = 'rakuten.png'
      } else if (link.indexOf('amazon.') !== -1) {
        icon = 'amazon.png'
      }
      html += `
      <div class="stock bottomshadow">
        <div class="dealer">
          <span>${mart}</span>
          <img src="//c.diaox2.com/cms/diaodiao/mart2/${icon}" />
        </div>
        <hr class="sep" />
        <div class="detail buylink">
          <table class="all">
            <tbody>
              <tr>
                <td class="allle">
                  <table>
                    <tbody>
                      <tr>
                        <td class="naming">
                          <span>价格：</span>
                        </td>
                        <td class="price">
                          ${price}
                        </td>
                      </tr>
                      <tr>
                        <td class="naming">
                          <span>说明：</span>
                        </td>
                        <td class="content">
                          <span>${intro}</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </td>
                <td class="allri" data-href="${link}">
                  <div>
                    <div></div><span>购买</span><img src="//c.diaox2.com/cms/diaodiao/assets/buywhitegt.png">
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div class="grayband"></div>
      `
    }
    return html
  }
}

module.exports = SkuParser
