const Render = require('../../')
const Utils = require('../../../utils/Utils')
const request = require('request')
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. 积分商城页        c.diaox2.com/view/app/?m=jfmall
 *  1. 积分商城页share页 c.diaox2.com/view/app/mall.html
 */
class JfMallRender extends Render {
  constructor () {
    super()
    this.template = this.readTemplate(__dirname + '/jfmall.ejs')
  }

  setPageType (pageType) {
    this.pageType = pageType
    return this
  }

  getRenderData () {
    return new Promise((resolve, reject) => {
      request(
        {
          url: 'http://bj2.a.dx2rd.com:3000/jf/mall',
          method: 'POST',
          json: true,
          headers: {
            'content-type': 'application/json'
          },
          body: { data: 'nothing' }
        },
        (error, response, body) => {
          if (error) reject(error)
          if (response.statusCode === 200) {
            resolve(body)
          } else {
            reject('接口返回错误的状态吗', response.statusCode)
          }
        }
      )
    })
  }

  async rende () {
    try {
      const result = (await this.getRenderData()) || {}
      // if (!Utils.isValidArray(items)) return
      return this.getDoc(this.template, {
        data: JSON.stringify(result.data || []),
        pageType: this.pageType,
        prefix: this.prefix,
        version: this.version
      })
    } catch (e) {
      console.log(e)
      Log.exception(e)
      return null
    }
  }
}

// const jfmall = new JfMallRender
// jfmall.rende().then(data => {
//   console.log(data)
// })

module.exports = JfMallRender
