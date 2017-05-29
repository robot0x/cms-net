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
  console.log('sids:', sids)
  return new Promise((resolve, reject) => {
    request(
      {
        url: 'http://s5.a.dx2rd.com:3000/v1/getsimplesku/',
        method: 'POST',
        json: true,
        headers: { 'content-type': 'application/json' },
        body: { sids }
      },
      (error, response, body) => {
        if (error) reject(error)
        if (response.statusCode === 200) {
          console.log('skus:', JSON.stringify(body.data))
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
module.exports = async html => {
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
    let src = Utils.addAliImageSuffix(Utils.getFirst(sku.images).url)
    console.log(src)
    $skuDom.find('.articleimg').attr('src', src)
    $skuDom.find('.articletitle').text(sku.title)
    $skuDom.find('.brand').text(sku.price_str)
  }
  // console.log(container.html())
  return container.html()
}
