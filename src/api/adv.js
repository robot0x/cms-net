const DB = require('../db/DB')
async function adv (isDev = false) {
  // 选出当前正在进行的广告和未来要上线的广告，即满足 now < end 条件的数据
  let sql = `SELECT type,can_leave,value,image,aid * 4294967297 AS id, start, end FROM ${isDev ? 'cms_adv_dev' : 'cms_adv'} where ${DB.escape(new Date())} < end`
  let advs = (await DB.exec(sql)) || []
  return advs.map(a => {
    a.start = Math.floor(new Date(a.start).getTime() / 1000)
    a.end = Math.floor(new Date(a.end).getTime() / 1000)
    return a
  })
}

module.exports = adv
