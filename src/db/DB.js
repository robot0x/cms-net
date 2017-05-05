const dbConfig = require('../../config/db')
// const mysql = require('promise-mysql')
const mysql = require('mysql')
const _ = require('lodash')
const Log = require('../utils/Log')
const runLogger = Log.getLogger('cms_run')
const varLogger = Log.getLogger('cms_var')
const CMS = 'cms'
const DIAODIAO = 'diaodiao'

/**
 * 提供基础的与数据库相关的工具方法
 */
class DB {
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
    return mysql.escape(str)
  }

  /**
   * 根据配置初始化连接池
   */
  static initPoolCluster (config) {
    const poolCluster = mysql.createPoolCluster()
    poolCluster.add(CMS, dbConfig[CMS])
    poolCluster.add(DIAODIAO, dbConfig[DIAODIAO])
    DB.poolCluster = poolCluster
  }
  /**
   * 执行单条sql语句，单条语句的话，没有必要执行事务
   */
   static exec (sql, data) {
     return new Promise((resolve, reject) => {
       DB.poolCluster.getConnection(CMS, DIAODIAO, function(err, connection) {
         if(err) {
           console.log(err)
           runLogger.error(err)
           reject(err)
         }
         console.log("[DB.exec] got connetion")
         console.log(`[DB.exe] prepare to run ${sql} ${data? `with ${data}` : ''}`)
         console.log(sql)
         connection.query(sql, data, (error, rows) => {
           connection.release()
           if(error){
             console.log(err)
             runLogger.error(err)
             reject(error)
           }
           resolve(rows)
         })
       })
     })
   }
}

DB.initPoolCluster()

module.exports = DB
