const dbConfig = require('../../config/db')
const mysql = require('promise-mysql')
const _ = require('lodash')
const Log = require('../utils/Log')
const runLogger = Log.getLogger('cms_run')
const varLogger = Log.getLogger('cms_var')
/**
 * 提供基础的与数据库相关的工具方法
 */
class DB {

  // DB.use('cms').exec('select * from article_meta')
  static use (database = 'cms') {
    // return mysql.createPool(dbConfig)
    // DB.initPool(dbConfig)
    // return DB
    return DB.initPool(dbConfig[database])
    // return DB
  }
  // id = 1 => where id = 1
  static addWhere (cond) {
    if(cond){
      cond = DB.normalize(cond)
      if(cond) {
        return ` where ${cond} `
      }
    }
    return cond
  }
  /**
   * id = 1 => id = 1
   * {id:1, name: 'liyanfeng'} => id = 1, name = 'liyanfeng'
   * liyanfeng => liyanfeng
   */
  static normalize (cond) {
    if (cond) {
      cond = DB.escapeValue(cond)
    }

    if (_.isPlainObject(cond)) {
      const keys = Object.keys(cond)
      let ret = []
      for(let key of keys) {
        ret.push(`${key} = ${cond[key]}`)
      }
      cond = ret.join(',')
    }
    return cond
  }
  /**
   * 转码一个Object的value，防止sql注入
   */
  static escapeValue (cond) {
    let ret = cond
    if (_.isString(cond)) {
      let key = ''
      let value = ''
      if (cond.indexOf('=') !== -1) {
        [key, value] = cond.split(/\s*=\s*/)
        ret = `${key} = ${DB.escape(value)}`
      } else {
        ret = cond
      }
    } else if (_.isPlainObject(cond)) {
      const keys = Object.keys(cond)
      ret = {}
      for(let key of keys) {
        ret[key] = DB.escape(cond[key])
      }
    } else if (Array.isArray(cond)) {
      ret = []
      for(let c of cond) {
        ret.push(DB.escapeValue(c))
      }
    }
    return ret
  }

  /**
   * 转码，防止sql注入
   */
  static escape (str) {
    return DB.pool.escape(str)
  }

  /**
   * 根据配置初始化连接池
   */
  static initPool (config) {
    return mysql.createPool(config)
  }

  /**
   * 从连接池中取出一个连接
   */
  static getConnection () {
    return DB.pool.getConnection()
  }

  /**
   * 释放一个连接到连接池中
   */
  static releaseConnection (connection) {
    return DB.pool.releaseConnection(connection)
  }

  /**
   * 执行单条sql语句，单条语句的话，没有必要执行事务
   */
   static exec (sql, data) {
     return new Promise((resolve, reject) => {
       DB.getConnection().then(connection => {
           console.log("[DB.exec] got connetion")
           console.log(`[DB.exe] prepare to run ${sql} ${data? `with ${data}` : ''}`)
           console.log(sql)
           connection.query(sql, data).then(rows => {
             console.log('[DB.exec] got row ', rows.length);
             resolve(rows)
           }).catch(err => {
             console.log("[DB.exec] query error %s", err);
             varLogger.error(err);
             reject(err)
           }).finally(() => {
           // 一定要释放连接，否则可能导致连接池中无可用连接而hang住数据库
           this.releaseConnection(connection)
         })
       }).catch(e => {
         console.log("[DB.exec] getConnection error %s", err);
         varLogger.error(err);
         reject(err)
       })
     })
   }
}
DB.pool = DB.use()
// DB.exec('select * from diaodiao_article_meta').then(data => console.log(data.length))
// console.log(DB.escape('你好，再见\\ or 1 = 1'));
// console.log(DB.escapeValue({
//   name: '你好，再见\\ or 1 = 1'
// }));
// console.log(DB.escapeValue(['天王','盖帝虎']))
// console.log(DB.escape('哈哈哈'))
// console.log(DB.escape(''))   // ''
// console.log(DB.escape('').length)   // 2
// console.log(DB.escape(null)) // NULL
// console.log(DB.escape(undefined)) // NULL
// console.log(DB.escape(true)) // true
// console.log(DB.escape(false)) // false
// console.log(DB.escape(new Date())) // 2017-04-24 14:34:52.195
// DB.use('cms')
module.exports = DB

// exec (sql, data) {
//   return new Promise((resolve, reject) => {
//     this.getConnection().then(connection => {
//       connection.beginTransaction().then(() => {
//         connection.query(sql, data).then(rows => {
//           resolve(rows)
//           connection.commit()
//         }).catch(err => {
//           reject(err)
//           connection.rollback()
//           runLogger.error('SQL错误：', sql, err)
//         })
//       })
//       .catch(err => {
//         reject(err)
//         connection.rollback()
//         runLogger.error('SQL错误：', sql, err)
//       }).finally(() => {
//         // 一定要释放连接，否则可能导致连接池中无可用连接而hang住数据库
//         db.releaseConnection(connection)
//       })
//     })
//   })
// }
