const MetaService = require('../service/MetaService')
const metaService = new MetaService()
const Log = require('../utils/Log')
const _ = require('lodash')

async function getMetas (ids) {
  Log.business('[API meta] 输入参数为：', ids)
  let metas = (await metaService.getRawMetas(ids)) || []
  if (_.isPlainObject(metas)) {
    metas = [metas]
  }
  return { metas }
}

module.exports = getMetas
