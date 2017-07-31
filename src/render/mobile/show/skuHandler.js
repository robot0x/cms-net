const cheerio = require('cheerio')
const Utils = require('../../../utils/Utils')
const request = require('request')

const findSkuBySid = (skus, sid) => {
  for (let sku of skus) {
    if (sku.sid == sid) {
      return sku
    }
  }
}
const getSkusBySids = sids => {
  return new Promise((resolve, reject) => {
    request(
      {
        // url: 'http://s5.a.dx2rd.com:3000/v1/getsimplesku/',
        // getsimplesku没有brand字段，所以需要改为getfullsku接口
        url: 'http://s5.a.dx2rd.com:3000/v1/getfullsku/',
        method: 'POST',
        json: true,
        headers: { 'content-type': 'application/json' },
        body: { sids }
      },
      (error, response, body) => {
        if (error) reject(error)
        if (response.statusCode === 200) {
          resolve(body.data)
        } else {
          reject('接口返回错误的状态吗', response.statusCode)
        }
      }
    )
  })
}
/**
 * [对html内的sku标签进行处理，加上]
 */
module.exports = async (html, addAliImageArg = true, useSales = false) => {
  const $ = cheerio.load(`<div id="container">${html}</div>`, {
    decodeEntities: false
  })
  const container = $('#container')
  const skuDoms = Array.from(container.find('.articlecard'))
  const sids = skuDoms.map(skuDom => Number(skuDom.attribs['data-sid']))
  const skus = await getSkusBySids(sids)
  for (let skuDom of skuDoms) {
    let sid = skuDom.attribs['data-sid']
    const $skuDom = $(skuDom)
    let sku = findSkuBySid(skus, sid)
    // 发现如果在markdown中填了SKU，但是在SKU系统中还没有录入相应的SKU，则会导致SKU为undefined
    // 做一个防御，尽最大可能渲染出页面，然后页面出现异常，让编辑或用户报，不然连页面都显示不出来
    if (!sku) continue
    let src = Utils.getFirst(sku.images).url
    if (addAliImageArg) {
      src = Utils.addAliImageSuffix(src)
    }
    $skuDom.find('.articleimg').attr('src', Utils.addProtocolHead(src))
    $skuDom.find('.articletitle').text(sku.title)
    $skuDom.find('.brand').text(sku.price_str)
    $skuDom.append(`<span style="display:none;" data-sku-brand="sku_brand">${sku.brandku.brand}</span>`)
    // app原生数据渲染接口中type = sku的数据片段会用到sku的数据
    if (useSales) {
      $skuDom.append(`<span style="display:none;" data-sku-sales="sku_sales">${JSON.stringify(sku.sales)}</span>`)
    }
  }
  // console.log(container.html())
  return container.html()
}
