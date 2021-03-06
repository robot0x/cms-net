const fs = require('fs')
const path = require('path')
const MetaService = require('../../service/MetaService')
const metaService = new MetaService()
const ContentTable = require('../../db/ContentTable')
const contentTable = new ContentTable()
const Utils = require('../../utils/Utils')
const Log = require('../../utils/Log')
const _ = require('lodash')
const isDebug = process.env.NODE_ENV === 'dev'
// 20170503170435
function genFilename () {
  const date = new Date()
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()
  let minutes = date.getMinutes()
  let hours = date.getHours()
  let seconds = date.getSeconds()
  if (month < 10) {
    month = '0' + month
  }
  if (day < 10) {
    day = '0' + day
  }
  if (hours < 10) {
    hours = '0' + hours
  }
  if (minutes < 10) {
    minutes = '0' + minutes
  }
  if (seconds < 10) {
    seconds = '0' + seconds
  }
  // 生成 100000 - 999999 之间的6位随机数
  // let random = Math.floor(Math.random() * (999999 - 100000 + 1) + 100000)
  return year + month + day + hours + minutes + seconds
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
      const placeholder = 'http://a.diaox2.com/cms/diaodiao/assets/icon.png'
      let meta = Object.create(null)
      for (let me of metas) {
        let { nid, title, ctype } = me
        me.cid = +Utils.toLongId(nid)
        me.nid = String(nid)
        me.url = `http://c.diaox2.com/view/app/?m=${Utils.ctypeToM(me.ctype)}&id=${nid}`
        me.author.pic = me.author.pic.replace('/cms/diaodiao/', '')
        if (ctype === 5) {
          ctype = me.ctype = 1
          me.type = Utils.ctypeToType(ctype)
        }
        let [mtitle, titleex] = title
        let titles = mtitle.split(/ {2}/)
        // ctype == 3 不管title是否被分割，则一定要保证把titleex推入到数组最后，因为客户端依赖这个约定
        if (ctype === 3) {
          titles.push(titleex || '')
        }
        // if (titleex) {
        //   titles.push(titleex)
        // }
        // 如果不是专刊文章，使用coverex，处理完毕，后面加上 ctype !== 4 的原因时，不要覆盖ctype为4的cover_image_url
        // 因为后面需要使用原始的cover_image_url
        // bug：应该使用且而不是或，不然的话，如果ctype为3，则也是默认的placeholder
        // if (ctype !== 3 || ctype !== 4) {
        if (ctype !== 3 && ctype !== 4) {
          // 我们有些老的首页和经验其实是没有coverex的，所以，cover_image_url为空，但是为了确保
          // cover_image_url一定有值，可以使用占位图告诉编辑，这篇文章是没有coverex的
          me.cover_image_url = Utils.addProtocolHead(me.coverex_image_url, 'http') || placeholder
        }

        if (ctype === 4) {
          // 对于"activity"活动类型的文章，(ctype==4)，需要提供coverv3这个字段，这个字段就是cms的coverimage（注意不是coverex）
          me.coverv3 = Utils.addProtocolHead(me.cover_image_url, 'http')
        }
        // 图片策略
        // 如果是专题文章，cover_image_url使用占位符 https://a.diaox2.com/cms/diaodiao/assets/icon.png
        if (ctype === 9) {
          me.cover_image_url = placeholder
          let markdown = await contentTable.getById(nid)
          let ztdata = Utils.getZtDataByParseMarkdown(markdown || '')
          let list = []
          if (!_.isEmpty(ztdata)) {
            let {article, ids} = ztdata
            if (!_.isEmpty(ids)) {
              for (let id of ids) {
                list.push({
                  cid: Utils.toLongId(id),
                  summary: article[id]
                })
              }
            }
          }
          me.cid_list = list
        }
        if (ctype === 3) {
          console.log(`ID为${nid}的me.cover_image_url为${me.cover_image_url}`)
        }
        me.title = titles
        delete me.timetopublish
        delete me.coverex_image_url
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
          Log.exception(err)
          reject(err)
        }
        Log.business('[genpub]成功生成app文件，文件路径为：', filePath)
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
