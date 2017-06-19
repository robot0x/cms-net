const request = require('request')
const Promise = require('bluebird')
const Utils = require('./Utils')
class SKU {
  static _parse (sku, prop) {
    let val = sku[prop]
    if (typeof val === 'string') {
      try {
        sku[prop] = JSON.parse(val)
        // console.log('parsed images:', sku[prop])
        // console.log('typeof parsed images:', typeof sku[prop])
      } catch (error) {
        console.log(error)
        sku[prop] = val
      }
    }
    return sku
  }
  /**
   * 根据文章id拿文章关联的sku数组
   *
   * @static
   * @param {number} id 文章id
   * @param {boolean} [parse=false] 是否parse image 和 sales
   * @returns
   *
   * @memberof SKU
   */
  static async getSkusByArticleId (id, parse = true) {
    let skus = []
    try {
      const result = await Promise.promisify(request)(SKU.ARTICLE_SKU + id)
      const _skus = JSON.parse(result.body).data[Utils.toLongId(id)]
      if (parse) {
        skus = _skus.map(sku => {
          SKU._parse(sku, 'images')
          SKU._parse(sku, 'sales')
          SKU._parse(sku, 'revarticles')
          SKU._parse(sku, 'tags')
          return sku
        })
      } else {
        skus = _skus
      }
    } catch (error) {
      console.log(error)
    }
    // console.log('getSkusByArticleId skus:', skus)
    return skus
  }
  /**
   * 给定一个sku数组，判断是否有且仅有一个上线的sku
   * @static
   *
   * @memberof SKU
   */
  static isOnlyOneOnlineSKU (skus) {
    return Utils.isValidArray(skus) && skus.length === 1 && skus[0].status === 1
  }
}
SKU.ARTICLE_SKU = 'http://s5.a.dx2rd.com:3000/v1/articlesku/'

// SKU.getSkusByArticleId(5163, false).then(skus => {
//   console.log('no parse:', skus)
// })
// SKU.getSkusByArticleId(5163).then(skus => {
//   console.log('parse:', skus)
// })
module.exports = SKU
