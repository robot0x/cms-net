const Render = require('../../')
const Utils = require('../../../utils/Utils')
const request = require('request')
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. 值得买活动页
 *    c.diaox2.com/view/app/zdmactivity/3435973836800000.html
 *    c.diaox2.com/view/app/zdmactivity/3435973836800000_4553099126516997.html
 *  2. 值得买活动share页
 *    c.diaox2.com/view/app/zdmshare/3435973836800000.html
 *    c.diaox2.com/view/app/zdmshare/3435973836800000_4553099126516997.html
 */
class ZDMRender extends Render {
  constructor () {
    super()
    this.template = this.readTemplate(__dirname + '/zdm.ejs')
  }

  // setData (activity_cid, goods_cid) {
  //   this.activity_cid = activity_cid
  //   this.goods_cid = goods_cid
  //   return this
  // }

  // setPageType (pageType) {
  //   this.pageType = pageType
  //   return this
  // }

  getRenderData (param) {
    return new Promise((resolve, reject) => {
      // { activity_cid: [activity_cid],  goods_cid: [4553099126516997,4553099126516997] }
      const { activityCid } = param
      const body = { activity_cid: [+activityCid] }
      // if (goods_cid) {
      //   data.goods_cid = [+goods_cid]
      // }
      request(
        {
          url: 'http://api.diaox2.com/v4/zdm_activity',
          method: 'POST',
          json: true,
          headers: { 'content-type': 'application/json' },
          // 但其实一般不需要goods_cid这个项目
          body
        },
        (error, response, body) => {
          if (error) {
            console.log(error)
            reject(error)
          }
          if (response.statusCode === 200) {
            resolve(body)
          } else {
            reject('接口返回错误的状态吗', response.statusCode)
          }
        }
      )
    })
  }

  async rende (param, pageType) {
    if (!param) return
    try {
      const result = (await this.getRenderData(param)) || {}
      let {goodsCid, activityCid} = param
      // if (!result) return
      // TODO: 拿到数据之后进行处理
      let data = Utils.getFirst(result.res) || {}
      // if (!data) return
      data = JSON.stringify(data).replace(/^\{/, '').replace(/\}$/, '')
      if (!data) return
      // 因为是长id，所以长度至少10位，且值至少为4294967297
      if (!/^\d{10,}$/.test(goodsCid) || goodsCid < 4294967297) {
        goodsCid = -1
      }
      return this.getDoc(this.template, {
        data,
        goodsCid,
        // data: s.join(','),
        activityCid,
        pageType,
        downloadAddr: this.downloadAddr,
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

// const zdm = new ZDMRender
// zdm.setData(3705525985159720).rende().then(data => {
//   console.log(JSON.stringify(data))
// })

module.exports = ZDMRender
