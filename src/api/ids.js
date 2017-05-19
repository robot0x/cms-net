/*
 * @Author: liyanfeng
 * @Date: 2017-05-19 16:25:40
 * @Last Modified by: liyanfeng
 * @Last Modified time: 2017-05-19 16:42:00
 * 拿出所有在库文章的id
 */
const MetaTable = require('../db/MetaTable')
const metaTable = new MetaTable()
async function ids (orderBy = '') {
  return metaTable.getAllIds(orderBy)
}

module.exports = ids
