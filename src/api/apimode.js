const TagService = require('../service/TagService')
const tagService = new TagService()

async function apimode (tid) {
  const res = await tagService.getRenderData(tid, false, false, true)
  return res.metas
}

module.exports = apimode
