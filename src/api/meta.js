const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const Log = require('../utils/Log')

function getMetas (ids) {
  // let ids = arg.id || arg.ids
  Log.business('[API meta] 输入参数为：', ids)
  // console.log(metaService.setDebug(debug))
  // console.log(metaService.setLogid(logid))
  return metaService.getRawMetas(ids)
}

module.exports = getMetas
