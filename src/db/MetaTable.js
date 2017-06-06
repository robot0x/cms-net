const Table = require('./Table')
const Utils = require('../utils/Utils')
const Log = require('../utils/Log')

class MetaTable extends Table {
  constructor () {
    super(
      'diaodiao_article_meta',
      [
        'id',
        'title',
        'share_title',
        'wx_title',
        'wb_title',
        'ctype',
        'titleex',
        'titlecolor',
        'buylink',
        'timetopublish',
        'price',
        // 'status',
        'create_time',
        'last_update_time',
        // 'user',
        // 'lock_by',
        'last_update_by',
        'author'
      ],
      {
        columns: [
          'create_time', // timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '文章创建时间',
          'last_update_time' // timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON update CURRENT_TIMESTAMP COMMENT '文章最后更新时间',]
        ],
        pattern: '%Y-%m-%d %T'
      },
      'last_update_time'
    )
  }
  async getTitles (id) {
    const sql = `SELECT title, share_title, wx_title, wb_title FROM ${this.table} WHERE id=${id}`
    const list = await this.exec(sql)
    return Utils.getFirst(list)
  }
  async getAllIds (orderBy = '') {
    if (orderBy) {
      orderBy = ` ORDER BY ${orderBy} `
    }
    const sql = `SELECT id FROM ${this.table} ${orderBy}`
    const idlist = await this.exec(sql)
    if (!Utils.isValidArray(idlist)) return null
    const ids = []
    for (let row of idlist) {
      ids.push(row.id)
    }
    return ids
  }
  async getBySource (source) {
    return await this.getByCond({
      author: source
    })
  }

  async getRecordsByCond (col, cond) {
    const sql = `SELECT ${col} FROM ${this.table} WHERE ${cond}`
    const list = await this.exec(sql)
    const records = []
    for (let item of list) {
      records.push(item[col])
    }
    return records
  }

  async getBuylinkById (id) {
    return Utils.getFirst(await this.getRecordsByCond('buylink', `id = ${id}`))
  }

  async getAidsByCond (cond) {
    return this.getRecordsByCond('id', cond)
  }

  getAidsBySource (source) {
    return this.getAidsByCond(` author = ${super.escape(source)} AND ${Utils.genTimetopublishInterval()}`)
    // return this.getRecordsByCond('id' ,`author = ${super.escape(source)}`)
  }

  async getCtypeById (id) {
    let ctypes = await this.getRecordsByCond('ctype', `id = ${id}`)
    return Utils.getFirst(ctypes)
    // let data =  await this.exec(`SELECT ctype FROM ${this.table} WHERE id = ${id}`)
    // let meta = Utils.getFirst(data)
    // let ctype = null
    // if(meta){
    //   ctype = meta.ctype
    // }
    // return ctype
  }

  async getMetas (ids) {
    let data = null
    try {
      if (Utils.isValidArray(ids)) {
        data = await this.exec(
          `SELECT ${this.columnsStr} FROM ${this.table} WHERE id in (${ids.join(',')})`
        )
      } else {
        data = await this.getById(ids)
      }
    } catch (e) {
      Log.exception(e)
    }
    return data
  }
}

// const metaTable = new MetaTable()
// metaTable.getAllIds('timetopublish').then(data => {
// })
// metaTable.getCtypeById(1).then(data => console.log('ctype:', data))
// metaTable.getAidsBySource('ZRJ').then(data => console.log('aids:', data))
// metaTable.getBuylinkById(1).then(data => console.log('buylink:', data))
// metaTable.setColumns(['title', 'titleex', 'titlecolor', 'ctype', 'price', 'buylink', 'author'])
//          .getById(1)
//          .then(data => {
//            console.log(data)
//          })

module.exports = MetaTable
