const DB = require('../db/DB')
async function adv (isDev = false) {
  // insert into cms_adv (type, can_leave, value, image,aid) values ('link',1,'https://c.diaox2.com/view/app/?m=show&id=10633', 'https://content.image.alimmdn.com/adv/1234567890.jpg', 10633);
  let sql = `SELECT type,can_leave,value,image,aid * 4294967297 AS id, start, end FROM cms_adv `
  // 如果是灰度接口，则选出 now < start的数据，即还未上线的数据
  // 否则的话，选出 start <= now <= end 之间的数据
  let now = new Date()
  let escapeNow = DB.escape(now)
  let where = `where ${escapeNow} >= start AND ${escapeNow} <= end`
  if (isDev) {
    where = `where ${escapeNow} < start`
  }
  sql += where
  let advs = (await DB.exec(sql)) || []
  return advs.map(a => {
    a.start = Math.floor(new Date(a.start).getTime() / 1000)
    a.end = Math.floor(new Date(a.end).getTime() / 1000)
    return a
  })
}

module.exports = adv
