const DB = require('../db/DB')
const Log = require('../utils/Log')
async function metadump () {
  try {
    return await DB.exec(`SELECT id,ctype,author,timetopublish AS pubtime,title FROM diaodiao_article_meta`)
  } catch (error) {
    Log.exception(error)
  }
}

module.exports = metadump
