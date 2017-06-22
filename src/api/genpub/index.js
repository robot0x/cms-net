const MetaService = require('../../service/MetaService')
const fs = require('fs')
const path = require('path')
const metaService = new MetaService()
const Utils = require('../../utils/Utils')
const Log = require('../../utils/Log')
const isDebug = process.env.NODE_ENV === 'dev'
// 20170503170435
function genFilename () {
  const date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()
  if (month < 10) {
    month = '0' + month
  }
  if (day < 10) {
    day = '0' + day
  }
  // 生成 100000 - 999999 之间的6位随机数
  let random = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)
  return year + month + day + random
}

async function genpub (postData) {
  const renderVersion = 'v2.0.1'

  const fail = {
    result: 'FAIL',
    RENDER: renderVersion
  }
  return new Promise(async (resolve, reject) => {
    try {
      if (!postData) {
        return reject(fail)
      }
      Log.business('[API genpub] 输入参数为：', postData)
      let { iddict, version, tool, tool2, carousel } = postData
      let cids = Object.keys(iddict)
      // ids = [this.id],
      // useBuylink = true,
      // isShortId = false,
      // useCoverex = false,
      // useBanner = false,
      // useSwipe = false,
      // useImageSize = false,
      // useAuthorSource = false,
      // useTag = false
      let metas = (await metaService.getRawMetas(
        cids,
        true,
        false,
        true, // useCoverex
        true, // useBanner
        false,
        false,
        false,
        true // useTag
      )) || []
      if (!Array.isArray(metas)) {
        metas = [metas]
      }
      let meta = Object.create(null)
      for (let me of metas) {
        let { nid, title, ctype } = me
        me.cid = +Utils.toLongId(nid)
        me.nid = String(nid)
        me.url = `http://c.diaox2.com/view/app/?m=${Utils.ctypeToM(me.ctype)}&id=${nid}`
        me.author.pic = me.author.pic.replace('/cms/diaodiao/', '')
        if (ctype === 5) {
          me.ctype = 1
          me.type = Utils.ctypeToType(me.ctype)
        }
        let [mtitle, titleex] = title
        let titles = mtitle.split(/ {2}/)
        if (titleex) {
          titles.push(titleex)
        }
        // 图片策略
        // 如果是专题文章，cover_image_url使用占位符 https://a.diaox2.com/cms/diaodiao/assets/icon.png
        if (ctype === 9) {
          me.cover_image_url = 'https://a.diaox2.com/cms/diaodiao/assets/icon.png'
        } else if (ctype !== 3) { // 如果不是专刊文章，使用coverex，处理完毕
          me.cover_image_url = me.coverex_image_url
        }
        // 对于"activity"活动类型的文章，(ctype==4)，需要提供coverv3这个字段，这个字段就是cms的coverimage（注意不是coverex）
        if (ctype === 4) {
          me.coverv3 = meta.cover_image_url
        }
        me.title = titles
        delete me.timetopublish
        meta[Utils.toLongId(me.nid)] = me
      }
      const ret = {
        seq: iddict,
        version,
        tool,
        tool2,
        carousel,
        metas: meta
      }
      // 默认写在服务器约定好的目录
      let filePath = `/home/work/view2/output/${genFilename()}.app`
      // 如果是在本地，则写入当前目录下的views目录
      if (isDebug) {
        filePath = __dirname + `/views/${genFilename()}.app` // eslint-disable-line
      }
      fs.writeFile(filePath, JSON.stringify(ret), 'utf8', err => {
        if (err) {
          console.log(err)
          reject(err)
        }
        resolve({
          result: path.resolve(filePath),
          RENDER: renderVersion
        })
      })
    } catch (e) {
      Log.exception(e)
      reject(fail)
    }
  })
}

module.exports = genpub
