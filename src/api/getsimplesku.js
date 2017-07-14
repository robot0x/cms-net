const SKU = require('../utils/SKU')
const Utils = require('../utils/Utils')
const BuyinfoTable = require('../db/BuyinfoTable')
const buyinfoTable = new BuyinfoTable()
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
function _toPart (sales, id, type) {
  let showpart = []
  for (let sale of sales) {
    // console.log('_toPart sale:', sale)
    let ele = Object.create(null)
    // 必须确定这一条是sku还是buyinfo，不然的话，就不知道id是sid还是buyinfo的id
    ele.tag = type
    ele.type = 'link'
    ele.channel = sale.mart
    // 随意伸缩魔法衣架；不能直邮，需要转运，日本转运攻略见<a href=/view/app/?m=show&id=2127&ch=experience>这里</a>
    let { text, href, spec } = Utils.handleATag(sale.intro) || {}
    ele.des = text
    // 如果描述信息是这样的 "不能直邮，需要转运，日亚转运攻略见<a href=/view/app/?m=show&id=2127&ch=experience>这里</a>"
    // 则转换为 "不能直邮，需要转运，日亚转运攻略见<<这里>>"
    // 同时判断a标签的href是我们自己的链接还是外部链接。大部分清空下描述信息是没有a标签的，所以，返回给客户端的字段中没有
    // spec和spec_link字段
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

async function getsimplesku (id, tag = 'sku') {
  let ret = null
  if (/sku/i.test(tag)) {
    let sku = (await SKU.getSimpleSku(id)) || []
    ret = _toPart(sku.sales, id, 'sku')
  } else if (/buy/i.test(tag)) {
    const sales = await buyinfoTable.getById(id)
    ret = await this._toPart(sales, null, 'buy')
  }
  return {
    pick_up_part: ret
  }
}

getsimplesku(1, 'buy').then(res => {
  console.log(res)
})

module.exports = getsimplesku
