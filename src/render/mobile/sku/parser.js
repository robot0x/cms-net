const Parser = require('../../../parser')

class SkuParser {

  setSales(sales) {
    this.sales = sales
    return this
  }
  getRevarticleHTML (metas) {
    console.log('[SkuParser.getRevarticleHTML] metas:', metas)
    if(!Array.isArray(metas)) {
      metas = [metas]
    }
    let html = ''
    for (let meta of metas) {
      let {nid, thumb_image_url, title} = meta
      html += `
      <div class="articlecard bottomshadow revarticlecard" data-href="//c.diaox2.com/view/app/?m=show&id=${nid}">
        <img class="articleimg" src="${thumb_image_url}">
        <span class="articletitle">${title}</span>
        <span class="articleread unknown" data-id="${nid * 4294967297}">阅读 ...</span>
      </div>
      `
    }
    return html
  }
  getHTML(sales = this.sales) {
    let html = ''
    for (let sale of sales) {
      let {mart, price, intro, link_m_cps} = sale
      let icon = 'default.png'
      if (/tmall|天猫/.test(mart) || link_m_cps.indexOf('tmall.com') !== -1) {
        icon = 'tmall.png'
      } else if (link_m_cps.indexOf('taobao.com') !== -1) {
        icon = 'tb.png'
      } else if (link_m_cps.indexOf('jd.com') !== -1) {
        icon = 'jd.png'
      } else if (link_m_cps.indexOf('amazon.cn') !== -1) {
        icon = 'amazoncn.png'
      } else if (link_m_cps.indexOf('amazon.jp') !== -1) {
        icon = 'amazonjp.png'
      } else if (link_m_cps.indexOf('shopbop.com') !== -1) {
        icon = 'shopbop.png'
      } else if (link_m_cps.indexOf('rakuten.com') !== -1) {
        icon = 'rakuten.png'
      } else if (link_m_cps.indexOf('amazon.') !== -1) {
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
                <td class="allri" data-href="${link_m_cps}">
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
