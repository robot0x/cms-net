const request = require('request')
const Promise = require('bluebird')
const Utils = require('./Utils')
/**
 * SKU相关接口RPC调用封装
 * @class SKU
 */
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
   * http://s5.a.dx2rd.com:3000/v1/getsimplesku/1
   * @static
   * @param {number} sid
   * @returns sku
   * @memberof SKU
   */
  static async getSimpleSku (sid) {
    try {
      const result = await Promise.promisify(request)(SKU.GET_SIMPLE_SKU + sid)
      const res = JSON.parse(result.body)
      // console.log('[getSimpleSku] res', res)
      const { state, message, data } = res
      if (!/SUCCESS/i.test(state)) {
        console.log(message || '调用getsimplesku接口失败')
        return null
      }
      return Utils.getFirst(data)
    } catch (error) {
      return null
    }
  }
  /**
   * 根据文章id列表拿文章关联的sku数组
   *
   * @static
   * @param {array} ids 文章长id
   * @param {boolean} [parse=false] 是否parse image 和 sales
   * @returns
   *
   * @memberof SKU
   */
  static getSkusByArticleIds (ids, parse = true) {
    return new Promise((resolve, reject) => {
      request(
        {
          url: SKU.ARTICLE_SKU,
          method: 'POST',
          json: true,
          headers: { 'content-type': 'application/json' },
          body: { cids: Utils.toLongId(ids) }
        },
        (error, response, body) => {
          if (error) reject(error)
          if (response.statusCode !== 200 || /SUCCESS/i.test(body.state)) {
            let { data } = body
            let ret = Object.create(null)
            Object.keys(data).forEach(longId => {
              if (parse) {
                ret[Utils.toShortId(longId)] = data[longId].map(sku => {
                  SKU._parse(sku, 'images')
                  SKU._parse(sku, 'sales')
                  SKU._parse(sku, 'revarticles')
                  SKU._parse(sku, 'tags')
                  return sku
                })
              } else {
                ret[Utils.toShortId(longId)] = data[longId]
              }
            })
            resolve(ret)
          } else {
            reject('接口返回错误的状态吗', response.statusCode)
          }
        }
      )
    })
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
    return (
      Utils.isValidArray(skus) && skus.length === 1 && skus[0].status === 1
    )
  }
}
SKU.ARTICLE_SKU = 'http://s5.a.dx2rd.com:3000/v1/articlesku/'
SKU.GET_SIMPLE_SKU = 'http://s5.a.dx2rd.com:3000/v1/getsimplesku/'

// SKU.getSkusByArticleId(5163, false).then(skus => {
//   console.log('no parse:', skus)
// })
// SKU.getSkusByArticleId(5163).then(skus => {
//   console.log('parse:', skus)
// })
// SKU.getSimpleSku(1).then(res => {
//   console.log(res)
// })
SKU.getSkusByArticleIds([1, 2, 3]).then(res => {
  console.log(res)
})
module.exports = SKU
