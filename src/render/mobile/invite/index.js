const Render = require('../../')
const Utils = require('../../../utils/Utils')
const request = require('request')
/**
 * 渲染：
 *  1. 邀请页 http://c..diaox2.com/view/app/invite/42.html
 */
class InviteRender extends Render {

  constructor (uid) {
    super()
    this.setUid(uid)
    this.template = this.readTemplate(__dirname + '/invite.ejs')
  }

  setUid (uid) {
    this.uid = uid
    return this
  }

  getRenderData (uid = this.uid) {
    return new Promise((resolve, reject) => {
      request({
        url: 'http://bj2.a.dx2rd.com:3000/jf/inviter',
        method: "POST",
        json: true,
        headers: {
          "content-type": "application/json"
        },
        body: { uid }
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
    const {uid} = this
    if(!uid) return
    try {
      const result = await this.getRenderData(uid)
      if(!result) return
      const { invite_str, nick } = result.data
      return this.getDoc(this.template, {
        invite_str,
        nick,
        version: this.version
      })
    } catch (e) {
      console.log(e)
    }
  }
}

const inviter = new InviteRender
inviter.setUid(42).rende()

module.exports = InviteRender
