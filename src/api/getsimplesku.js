const SKU = require('../utils/SKU')
const Utils = require('../utils/Utils')
/**
 *
 *
 * @param {array} sales
 * @param {number} id
 * @param {string} type
 *
 * @memberof Show
 "channel": "淘宝",
"buy_link": "www.baidu.com",
"des": "软边白板已下架，此链接为铝边白板的链接",
"price": 233,
"id": 123,//skuID用于4.0需求sku失效用户可以进行反馈
"type":"link"//用于判断跳转类型 3x版本都为link
*/
function _toShowpart (sales, id, type) {
  let showpart = []
  for (let sale of sales) {
    // console.log('_toShowpart sale:', sale)
    let ele = Object.create(null)
    // 必须确定这一条是sku还是buyinfo，不然的话，就不知道id是sid还是buyinfo的id
    ele.tag = type
    ele.type = 'link'
    ele.channel = sale.mart
    // 随意伸缩魔法衣架；不能直邮，需要转运，日本转运攻略见<a href=/view/app/?m=show&id=2127&ch=experience>这里</a>
    let { text, href, spec } = Utils.handleATag(sale.intro) || {}
    ele.des = text
    if (href) {
      ele.spec = spec
      ele.spec_link = href
    }
    ele.price = sale.price
    ele.buy_link =
      sale.link_m_cps ||
      sale.link_pc_cps ||
      sale.link_m_raw ||
      sale.link_pc_raw
    if (id) {
      ele.id = id
    }
    if (type === 'buyinfo') {
      ele.buy_link = sale.link || sale.link_pc
      ele.id = sale.buy_id
    }
    showpart.push(ele)
  }
  return showpart
}

async function getsimplesku (sid) {
  let sku = (await SKU.getSimpleSku(sid)) || []
  let ret = _toShowpart(sku.sales, sid, 'sku')
  return Utils.getFirst(ret)
}

getsimplesku(1).then(res => {
  console.log(res)
})

module.exports = getsimplesku
