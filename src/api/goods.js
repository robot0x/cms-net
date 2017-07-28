/*
 * @Author: liyanfeng
 * @Date: 2017-07-28 11:49:40
 * @Last Modified by: liyanfeng
 * @Last Modified time: 2017-07-28 12:03:06
 * app原生渲染需要用到的下方的“猜你喜欢”喜欢的数据。由recommend接口变形而来
 */

let recommend = require('./recommend')
let Utils = require('../utils/Utils')
let request = require('request')

let getStat = aids => {
  if (!Utils.isValidArray(aids)) return {}
  aids = Utils.toLongId(aids)
  return new Promise((resolve, reject) => {
    request(
      {
        url: 'http://api.diaox2.com/v1/stat/all',
        method: 'POST',
        json: true,
        headers: { 'content-type': 'application/json' },
        body: { aids }
      },
      (error, response, body) => {
        if (error) reject(error)
        if (response.statusCode === 200) {
          resolve(body.res)
        } else {
          reject('接口返回错误的状态吗', response.statusCode)
        }
      }
    )
  })
}

let goods = async id => {
  let goods = recommend(id, null, true)
  if (goods) {
    let shouldGetStatCids = []
    goods = goods.map(good => {
      // 如果猜你喜欢中有price就下发price，否则，下发收藏数
      let { cover, title, type, serverid, price } = good
      let article_id = Utils.toShortId(serverid); // eslint-disable-line
      let newGood = {
        // image: good.thumb,
        image: cover,
        title: title,
        ctype: Utils.typeToCtype(type),
        article_id
      }
      if (price && price.trim() && !/N\/A/i.test(price)) {
        newGood.price = price
      } else {
        shouldGetStatCids.push(serverid)
      }
      return newGood
    })
    if (Utils.isValidArray(shouldGetStatCids)) {
      let stat = await getStat(shouldGetStatCids)
      goods = goods.map(good => {
        let serverid = Utils.toLongId(good.article_id)
        if (shouldGetStatCids.indexOf(serverid) === -1) return good
        good.favo_count = (stat[serverid] || Object.create(null)).fav || 0
        return good
      })
    }
  } else {
    goods = []
  }
}

module.exports = goods
// goods(`8385`).then(data => {
//   console.log(data)
// })
