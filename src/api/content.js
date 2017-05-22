/*
 * @Author: liyanfeng
 * @Date: 2017-05-19 16:49:25
 * @Last Modified by: liyanfeng
 * @Last Modified time: 2017-05-20 23:40:07
 * 根据id返回纯文本的接口：
 *  纯文本是指用户能看到的文本，即去掉标签和markdown标记的文本
 * 返回的纯文本分为3种：
 *  1、正文页，包括firstpage、goodthing、activity、expreience
 *  2、专刊页
 *  3、专题页
 */
const Parser = require('../parser')
const parser = new Parser()
const ZKParser = require('../render/mobile/zk/parser')
const zkParser = new ZKParser()
const ZTParser = require('../render/mobile/zt/parser')
const ztParser = new ZTParser()
const DB = require('../db/DB')
const Utils = require('../utils/Utils')

async function content (ids) {
  let ret = []
  let isNumber = false
  if (!Array.isArray(ids)) {
    ids = [ids]
    isNumber = true
  }
  let sql = `
  SELECT 
    meta.id, meta.ctype, con.content 
  FROM 
    diaodiao_article_meta AS meta 
  LEFT JOIN
    diaodiao_article_content AS con
  ON
    meta.id = con.aid
  WHERE 
    meta.id 
  IN
    (${ids.join(',')})
    `
  // console.log('sql:', sql)
  const results = await DB.exec(sql)
  // console.log('results:', results)
  // const ret = []
  for (let result of results) {
    let res = Object.create(null)
    let {ctype} = result
    console.log('ctype22:', ctype)
    res.id = result.id
    res.ctype = ctype
    const {content} = result
    if (/1|2|4|5/.test(ctype)) {
      parser.markdown = content
      res.content = parser.getText()
    } else if (ctype === 3) {
      zkParser.markdown = content
      res.conetnt = zkParser.getText()
    } else if (ctype === 9) {
      ztParser.markdown = content
      res.conetnt = ztParser.getText()
    }
    ret.push(res)
  }
  if (isNumber) {
    return Utils.getFirst(ret)
  } else {
    return ret
  }
}

module.exports = content
