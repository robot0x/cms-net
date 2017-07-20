const DB = require('../db/DB')
const Utils = require('../utils/Utils')
const Log = require('../utils/Log')
async function relsearch (id) {
  if (!id) return null
  Log.business('[API relsearch] 输入参数为：', id)
  let sql = `SELECT related_words FROM diaodiao_sim_query WHERE aid = ${id}`
  let relwords = Utils.getFirst(await DB.exec(sql))
  Log.business(`[API relsearch] ${sql}\nfetch data is ${relwords} `)
  if (relwords && relwords.related_words && relwords.related_words.trim()) {
    relwords = relwords.related_words.split(/\s/)
  } else {
    relwords = []
  }
  return relwords
}

module.exports = relsearch
