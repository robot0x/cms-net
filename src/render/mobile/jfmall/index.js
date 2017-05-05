const Render = require('../../')
const Utils = require('../../../utils/Utils')
const request = require('request')
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
      request({
        url: 'http://bj2.a.dx2rd.com:3000/jf/mall',
        method: "POST",
        json: true,
        headers: {
          "content-type": "application/json"
        },
        body: { data: 'nothing' }
      }, (error, response, body) => {
        if(error) reject(error)
        if(response.statusCode == 200) {
          resolve(body)
        } else {
          reject('接口返回错误的状态吗', response.statusCode)
        }
      })
    })
  }

  async rende () {
    try {
      const result = await this.getRenderData()
      if(!result) return
      let items = result.data
      if(!Utils.isValidArray(items)) return
      let s = []
      for(let item of items){
        s.push(JSON.stringify(item))
      }
      return this.getDoc(this.template, {
        data: s.join(','),
        pageType: this.type,
        prefix: this.prefix,
        version: this.version
      })
    } catch (e) {
      console.log(e)
    }
  }
}

// const jfmall = new JfMallRender
// jfmall.rende().then(data => {
//   console.log(data)
// })

module.exports = JfMallRender
