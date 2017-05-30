const dbConfig = require('../../config/db')
const mysql = require('mysql')
const _ = require('lodash')
const Log = require('../utils/Log')
/**
 * 提供基础的与数据库相关的工具方法
 */
class DB {
  // id = 1 => where id = 1
  static addWhere (cond) {
    if (cond) {
      cond = DB.normalize(cond)
      if (cond) {
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
      for (let key of keys) {
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
      for (let key of keys) {
        ret[key] = DB.escape(cond[key])
      }
    } else if (Array.isArray(cond)) {
      ret = []
      for (let c of cond) {
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
  static initPool (dbConfig) {
    DB.pool = mysql.createPool(dbConfig)
    // return mysql.createPool(dbConfig)
  }

  /**
   * 从连接池中取出一个连接
   */
  // static getConnection () {
  //   return DB.pool.getConnection()
  // }

  /**
   * 释放一个连接到连接池中
   */
  // static releaseConnection (connection) {
  //   return DB.pool.releaseConnection(connection)
  // }

  /**
   * 执行单条sql语句，单条语句的话，没有必要执行事务
   */
  /**
   * 执行单条sql语句，单条语句的话，没有必要执行事务
   */
  static exec (sql, data) {
    return new Promise((resolve, reject) => {
      DB.pool.getConnection((err, connection) => {
        //  DB.poolCluster.getConnection(CMS, DIAODIAO, function(err, connection) {
        if (err) {
          reject(err)
          Log.exception(err)
        } else {
          connection.query(sql, data, (error, rows) => {
            connection.release()
            Log.business(
              `[DB.exe] ${sql} ${data ? `with ${JSON.stringify(data)}` : ''}\nfetch rows's length is ${rows.length} `
            )
            if (error) {
              console.log(error)
              Log.exception(error)
              reject(error)
            } else {
              resolve(rows)
            }
          })
        }
      })
    })
  }
}
DB.initPool(dbConfig)
module.exports = DB
