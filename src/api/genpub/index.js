const MetaService = require('../../service/MetaService')
const fs = require('fs')
const path = require('path')
const metaService = new MetaService()
const Utils = require('../../utils/Utils')
const Log = require('../../utils/Log')

// 20170503170435
function genFilename () {
  const date = new Date
  let year = date.getFullYear()
  let month = date.getMonth() + 1
  let day = date.getDate()
  if(month < 10) {
    month = '0' + month
  }
  if(day < 10){
    day = '0' + day
  }
  // 生成 100000 - 999999 之间的6位随机数
  let random = Math.floor(Math.random() * ( 999999 - 100000 + 1) + 100000 )
  return year + month + day + random
}

async function genpub (postData) {
  const renderVersion = "v2.0.1"

  const fail = {
    result: "FAIL",
    RENDER: renderVersion
  }
  return new Promise(async (resolve, reject) => {
    try {
      if(!postData) {
        return reject(fail)
      }
      Log.business('[API genpub] 输入参数为：', postData)
      let {iddict, version, tool, tool2, carousel} = postData
      let cids = Object.keys(iddict)
      let metas = await metaService.getRawMetas(cids)
      const ret = {
        seq: iddict,
        version,
        tool,
        tool2,
        carousel,
        metas
      }
      const filePath = __dirname + `/views/${genFilename()}.app`
      fs.writeFile(filePath, JSON.stringify(ret), 'utf8', err => {
        if(err){
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
