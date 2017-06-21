const Render = require('../../')
const Utils = require('../../../utils/Utils')
const request = require('request')
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. 积分商品页        c.diaox2.com/view/app/?m=jfitem&gid=102
 *  1. 积分商品页share页 c.diaox2.com/view/app/jfitem/102.html
 */
class JfitemRender extends Render {
  constructor (gid) {
    super()
    // this.setGid(gid)
    this.template = this.readTemplate(__dirname + '/jfitem.ejs')
  }

  // setGid (gid) {
  //   this.gid = gid
  //   return this
  // }
  // setPageType (pageType) {
  //   this.pageType = pageType
  //   return this
  // }

  getRenderData (gid) {
    if (!gid) return
    return new Promise((resolve, reject) => {
      request(
        {
          url: 'http://bj2.a.dx2rd.com:3000/jf/goods',
          method: 'POST',
          json: true,
          headers: {
            'content-type': 'application/json'
          },
          body: { gid }
        },
        (error, response, body) => {
          if (error) reject(error)
          if (response.statusCode == 200) {
            resolve(body)
          } else {
            reject('接口返回错误的状态吗', response.statusCode)
          }
        }
      )
    })
  }

  async rende (gid, pageType) {
    if (!gid) return
    try {
      const result = (await this.getRenderData(gid)) || {}
      if (!result) return
      let item = result.data
      /**
       * 发现一个bug，在ios app内，积分商城上的图片打不开，原因是由于ios app的ATS限制，
       * 图片链接必须得是https的
       */
      let { cover, thumb, pics } = item
      item.cover = Utils.addProtocolHead(cover)
      item.thumb = Utils.addProtocolHead(thumb)
      if (Utils.isValidArray(pics)) {
        pics = pics.map(pic => {
          pic.url = Utils.addProtocolHead(pic.url)
          return pic
        })
      }
      return this.getDoc(this.template, {
        data: JSON.stringify(item),
        pageType: pageType,
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

// const jfitem = new JfitemRender()
// jfitem.setGid(102).rende().then(data => {
// console.log(data)
// })

module.exports = JfitemRender
