const DB = require('../db/DB')
const Utils = require('../utils/Utils')

async function relsearch (id) {
  if(!id) return null
  let relwords = Utils.getFirst(await DB.exec(`SELECT related_words FROM diaodiao_sim_query WHERE aid = ${id}`))
  if(relwords) {
    relwords = relwords.related_words.split(/\s/)
  }
  console.log(relwords)
  return relwords
}

module.exports = relsearch
