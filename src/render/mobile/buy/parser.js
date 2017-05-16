// const Parser = require('../../../parser')

class BuyParser {
  setBuyinfos (buyinfos) {
    this.buyinfos = buyinfos
    return this
  }

  getHTML (buyinfos = this.buyinfos) {
    let html = ''
    for (let buyinfo of buyinfos) {
      let { mart, price, intro, link } = buyinfo
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

module.exports = BuyParser
