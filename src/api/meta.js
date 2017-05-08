const MetaService = require('../service/MetaService')
const metaService = new MetaService

function getMetas (ids) {
 return metaService.getRawMetas(ids)
}

module.exports = getMetas
