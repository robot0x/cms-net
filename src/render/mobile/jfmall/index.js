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

  // setPageType (pageType) {
  //   this.pageType = pageType
  //   return this
  // }

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

  async rende (pageType) {
    try {
      const result = (await this.getRenderData()) || {data: []}
      let data = result.data
      /**
       * 发现一个bug，在ios app内，积分商城上的图片打不开，原因是由于ios app的ATS限制，
       * 图片链接必须得是https的
       */
      data = data.map(item => {
        let {cover, thumb, pics} = item
        item.cover = Utils.addProtocolHead(cover)
        item.thumb = Utils.addProtocolHead(thumb)
        let picsObj = null
        try {
          picsObj = JSON.parse(pics)
        } catch (error) {
          console.log(error)
        }
        if (Utils.isValidArray(picsObj)) {
          item.pics = JSON.stringify(
            picsObj.map(pic => {
              pic.url = Utils.addProtocolHead(pic.url)
              return pic
            })
          )
        }
        return item
        /**
         * {  gid: 120,
              status: 1,
              type: 0,
              title: '【限量兑换|499分+59元】英国肯特小号猪鬃梳',
              cover: 'http://content.image.alimmdn.com/sku/1489634602640s_jpg.jpg',
              thumb: 'http://content.image.alimmdn.com/sku/1489634595188s_jpg.jpg',
              pics: '[{"url":"http://content.image.alimmdn.com/sku/1489634589640s_jpg.jpg"}]',
              intro: '【499分+59元】这款梳子来自英国皇室御用百年品牌Kent，也是有调梳子评测中最令人满意的选手！天然猪鬃养护发质，圆点刷头轻柔按摩头皮，不管是在处理打结还是按摩头皮等方面都表现不错，使用后头发柔顺有光泽。',
              ec: '有调',
              price: 499,
              quantity: 0,
              stocknum: 18,
              sid: null,
              limited: 1,
              desc: '1、积分兑换后一周内有效，请各位调友尽快在有调官方淘宝店下单兑换商品哟~\n2、限量商品，换完无补哟～',
              usage: '1. 用户点击最下方“立即兑换”按钮，成功兑换后将会出现一个兑换链接。点击兑换链接进入有调官方店铺。\n2.拍下“积分礼品”商品后，请准确填写您的收件地址及联络信息，并在订单备注处留下您的有调用户ID名称及所兑换的礼品名称。有调的工作人员会在核实相关信息后为您寄出礼品。',
              target: 'https://item.taobao.com/item.htm?id=546715316278',
              last_valid_time: '2017-12-31 23:55:00',
              pub_time: '2017-04-19T09:45:15.000Z',
              last_mod: '2017-06-09T16:09:01.000Z' 
            }
         */
      })
      // console.log('data:', data)
      // if (!Utils.isValidArray(items)) return
      return this.getDoc(this.template, {
        data: JSON.stringify(data),
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

// const jfmall = new JfMallRender
// jfmall.rende().then(data => {
//   console.log(data)
// })

module.exports = JfMallRender
