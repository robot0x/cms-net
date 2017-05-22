/*
 * @Author: liyanfeng
 * @Date: 2017-05-19 16:49:25
 * @Last Modified by: liyanfeng
 * @Last Modified time: 2017-05-19 17:48:15
 */
const Parser = require('../parser')
const parser = new Parser()
const ContentTable = require('../db/ContentTable')
const contentTable = new ContentTable()
const Utils = require('../utils/Utils')
async function content (ids) {
  let ret = null
  if (/^\d+$/.test(ids)) {
    ret = Object.create(null)
    const cont = await contentTable.getById(ids)
    console.log(cont)
    parser.markdown = cont
    ret.id = Number(ids)
    ret.content = parser.getText()
  } else {
    ret = []
    const conts = await contentTable.getByIds(Utils.toShortId(ids))
    console.log('conts:', conts)
    for (let cont of conts) {
      parser.markdown = cont.content
      ret.push({
        id: cont.id,
        content: parser.getText()
      })
    }
  }
  return ret
}

module.exports = content
