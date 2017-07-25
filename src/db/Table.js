const DB = require('./DB')
const Promise = require('bluebird')
const _ = require('lodash')
const Utils = require('../utils/Utils')
const Log = require('../utils/Log')
/**
 * 所有业务表要继承的基类
 * 提供了一些常用的数据库操作
 * 所有继承该类的类在相应的Service中调用
 */
class Table {
  /**
   * table: 操作的表名
   * columns: 要操作的表的列
   * format: 是否格式化日期字段
   * orderByCol：排序字段
   */
  constructor (table, columns, format, orderByCol) {
    this.init(table, columns, format, orderByCol)
  }

  init (table, columns, format, orderByCol) {
    this.setTable(table)
    this.setColumns(columns)
    this.setFormat(format)
    this.setOrderByCol(orderByCol)
    return this
  }

  setTable (table) {
    this.table = table
    return this
  }

  setColumns (columns) {
    this.columns = columns
    this.columnsStr = this.columns.map(col => `\`${col}\``).join(',')
    return this
  }

  setFormat (format) {
    if (format) {
      const { columns, pattern } = format
      this.columns = this.columns.concat(
        columns.map(col => `DATE_FORMAT(${col},'${pattern}') AS ${col}`)
      )
    }
    return this
  }

  setOrderByCol (orderByCol) {
    this.orderByCol = orderByCol
    return this
  }

  /**
   * 往表中插入一条数据
   */
  create (data) {
    return DB.exec(`INSERT INTO ${this.table} SET ?`, data)
  }

  /**
   * 获取符合条件的记录数
   * @type {String} 条件
   */
  total (cond) {
    return new Promise((resolve, reject) => {
      DB.exec(
        `SELECT count(1) AS count FROM ${this.table} ${DB.addWhere(cond)}`
      )
        .then(data => {
          if (data.length > 0) {
            resolve(data[0].count)
          } else {
            resolve(0)
          }
        })
        .catch(e => {
          reject(e)
          Log.exception(e)
        })
    })
  }

  /**
 * 根据主键id获取一条数据
 */
  async getById (id) {
    let data = await this.getByCond(`id = ${id}`)
    if (Utils.isValidArray(data) && data.length === 1) {
      [data] = data
    }
    return data
  }

  /**
   * 根据文章id获取一条数据
   */
  getByAid (id) {
    return this.getByCond(`aid = ${id}`)
  }

   /**
   * 根据文章id列表获取多条数据
   */
  getByAids (ids) {
    return this.getByCond(`aid in (${ids.join(',')})`)
  }

  /**
   * 根据传入的条件获取数据
   */
  getByCond (cond) {
    return DB.exec(
      `SELECT ${this.columnsStr} FROM ${this.table} ${DB.addWhere(cond)}`
    )
  }

  /**
   * 根据传入的条件获取数据
   */
  getAll (pagination, orderBy = '', cond = '') {
    if (orderBy) {
      orderBy = ` ORDER BY ${this.orderByCol} DESC `
    }
    let limitStr = ''
    if (pagination && !_.isEmpty(pagination)) {
      limitStr = ` LIMIT ${pagination.offset || 0}, ${pagination.limit} `
    }
    const sql = `SELECT ${this.columnsStr} FROM ${this.table} ${DB.addWhere(cond)} ${orderBy} ${limitStr}`
    return DB.exec(sql)
  }

  deleteByCond (cond) {
    return DB.exec(`DELETE from ${this.table} ${DB.addWhere(cond)}`)
  }

  deleteById (id) {
    return this.deleteByCond(`id = ${id}`)
  }

  update (data, cond) {
    return DB.exec(`UPDATE ${this.table} set ? ${DB.addWhere(cond)}`, data)
  }

  exec (sql, data) {
    return DB.exec(sql, data)
  }

  escapeValue (cond) {
    return DB.escape(cond)
  }
  /**
   * 转码，防止sql注入
   */
  escape (str) {
    return DB.escape(str)
  }
}

// const table = new Table('article_meta', ['id', 'title'], null, 'last_update_by')
// table.getById(1).then(data => console.log(data))
// table.getByCond({id: 2}).then(data => console.log(data))
// table.getByCond('id=3').then(data => console.log(data))
// table.getByCond(`title like ${DB.escape('%咖啡%')}`).then(data => console.log(data))
// table.total().then(count => console.log(count))
// table.getAll().then(data => console.log(data.length))
// table.init('article_content', ['aid', 'content'], null, null)
// table.getByAId(1).then(data => console.log(data))
module.exports = Table
