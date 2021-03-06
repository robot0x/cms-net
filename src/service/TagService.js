const TagNameTable = require('../db/TagNameTable')
const TagIndexTable = require('../db/TagIndexTable')
const DB = require('../db/DB')
// const MetaService = require('./MetaService')
const Utils = require('../utils/Utils')
const Log = require('../utils/Log')

class TagService {
  constructor () {
    this.tagNameTable = new TagNameTable()
    this.tagIndexTable = new TagIndexTable()
    // console.log('[TagService initial ....]')
    // this.metaTable = new MetaTable
    // this.metaService = new MetaService()
    // this.setTid(tid)
    // 渲染的list只有前20条有图片
    this.setLimit(-1)
  }

  setLimit (limit) {
    this.limit = limit
    return this
  }
  // async getTagInfosByAids (aids) {
  //   let tags = (await this.tagIndexTable.getByAids(aids)) || []
  // }
  async getParentTagByTid (tid, columns = ['tid', 'name']) {
    return await this.tagNameTable.getParentTagByTid(tid, columns)
  }

  //  tags = [{
  //    name: xxx,
  //    tid: 100000,
  //    children: [{
  //      name: yyy,
  //      tid: 100001
  //    },{
  //      name: zzz,
  //      tid: 100002
  //    }]
  //   }]
  _findByParent (tags, parent) {
    const ret = []
    for (const tag of tags) {
      if (tag.parent === parent) {
        ret.push({ tid: tag.tid, name: tag.name })
      }
    }
    return ret
  }

  async getTagTree () {
    const { tagNameTable } = this
    try {
      tagNameTable.setColumns(['tid', 'name', 'parent', 'level'])
      const alltags = await tagNameTable.getAll()
      const tree = []
      const res = [...alltags]
      alltags.filter(tag => tag.level === 1).map(tag => {
        tree.push({
          tid: tag.tid,
          name: tag.name,
          children: this._findByParent(res, tag.tid)
        })
      })
      return tree
    } catch (e) {
      console.log(e)
      Log.exception(e)
      return null
    }
  }

  // 渲染数据接口
  async getRenderData (
    tid,
    useImage = true,
    useThumb = true,
    useTimetopublish = false,
    useCtype = false
  ) {
    // const { tagNameTable, tagIndexTable, metaTable } = this
    // tagNmaeTable tag的元数据表
    // tagIndexTable 文章关联的tag表
    const { tagNameTable, tagIndexTable, limit } = this
    try {
      let item = (await tagNameTable.getByTid(tid)) || {}
      let { level, name } = item
      let tags = null
      // console.log('[TagService.getRenderData]:', item)
      switch (level) {
        // 如果是一级分类
        case 1:
          tags = await tagIndexTable.getByTag1(name)
          break
        // 如果是二级分类
        case 2:
          tags = await tagIndexTable.getByTag2(name)
          break
      }
      if (!tags) {
        Log.exception(`Tag页渲染失败，输入的tid为${tid}`)
        return
      }
      // 拿到所有aids，通过aids拿出所有meta，这个需要写自己写sql
      const aids = tags.map(tag => tag.aid)
      let metaSql = ''
      // timetopublish不再规定范围内，不予显示。详见middleware.js关于__debug__的说明。
      // apimode接口使用
      if (useTimetopublish) {
        metaSql = `SELECT CONCAT('', id) AS aid, CONCAT('', timetopublish) AS pubtime FROM diaodiao_article_meta where id in (${aids.join(',')}) AND ${Utils.genTimetopublishInterval('timetopublish', true)} ORDER BY timetopublish DESC`
      } else {
        // app内tag页原生渲染数据接口要用到Ctype
        if (useCtype) {
          metaSql = `SELECT id, CONCAT(title,titleex) AS title, ctype FROM diaodiao_article_meta where id in (${aids.join(',')}) AND ${Utils.genTimetopublishInterval('timetopublish', true)} ORDER BY timetopublish DESC`
        } else {
          metaSql = `SELECT id, CONCAT(title,titleex) AS title FROM diaodiao_article_meta where id in (${aids.join(',')}) AND ${Utils.genTimetopublishInterval('timetopublish', true)} ORDER BY timetopublish DESC`
        }
      }
      // 此数组已经有顺序，顺序是按照timetopublish从大到小排列
      const metas = await DB.exec(metaSql)
      let sliceAids = null
      // 这儿有逻辑错误，不应该截断aids，应该截断有顺序的metas
      if (limit !== -1) {
        sliceAids = metas.slice(0, limit).map(meta => meta.id)
      } else {
        sliceAids = metas.map(meta => meta.id)
      }
      let ret = Object.create(null)
      let images = null
      if (useImage) {
        let type = 8
        if (!useThumb) {
          type = 2
        }
        let sql = `SELECT url,aid FROM diaodiao_article_image where aid in (${sliceAids.join(',')}) AND type & ${type} = ${type}`
        Log.business(`[TagService.getRenderData] imagesSql: ${sql}`)
        images = await DB.exec(sql)
        ret.images = images
      }
      ret.metas = metas
      ret.name = name
      // limit没必要传，因为这个值就是调用的地方set进去的
      return ret
    } catch (e) {
      console.log(e)
      Log.exception(e)
      return null
    }
  }
}

// const ts = new TagService()
// ts.getTagTree().then(data => console.log(JSON.stringify(data)))
// ts.getTagInfosByAids([8154, 8213]).then(data => console.log(JSON.stringify(data)))

module.exports = TagService
