const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const Log = require('../utils/Log')

function getMetas (ids) {
  Log.business('[API meta] 输入参数为：', ids)
  return metaService.getRawMetas(ids)
}

module.exports = getMetas
