const TagNameTable = require('../db/TagNameTable')
const TagIndexTable = require('../db/TagIndexTable')
const DB = require('../db/DB')
const MetaService = require('./MetaService')
const Utils = require('../utils/Utils')
const Log = require('../utils/Log')
const run = Log.getLogger('cms_run')

class TagService {

  constructor (tid) {
    this.tagNameTable = new TagNameTable
    this.tagIndexTable = new TagIndexTable
    console.log('[TagService initial ....]')
    // this.metaTable = new MetaTable
    this.metaService = new MetaService
    this.setTid(tid)
    // 渲染的list只有前20条有图片
    this.setLimit(-1)
  }

  setLimit (limit) {
    this.limit = limit
    return this
  }

  setTid (tid) {
    this.tid = tid
  }

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
  _findByParent (tags, parent){
      const ret = []
      for(const tag of tags){
        if(tag.parent === parent){
          ret.push({ tid: tag.tid, name: tag.name })
        }
      }
      return ret
  }

  async getTagTree () {
    const {tagNameTable} = this
    try {
      tagNameTable.setColumns(['tid','name','parent', 'level'])
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
      console.log(e);
    }
  }

  // 渲染数据接口
  async getRenderData (useThumb = true) {
    // const { tagNameTable, tagIndexTable, metaTable } = this
    const { tagNameTable, tagIndexTable, limit } = this
    try {
      let item = await tagNameTable.getByTid(this.tid)
      let { level, name } = item
      let tags = null
      // console.log('[TagService.getRenderData]:', item)
      switch (level) {
        // 如果是一级分类
        case 1:
          tags = await tagIndexTable.getByTag1(name)
          break;
        // 如果是二级分类
        case 2:
          tags = await tagIndexTable.getByTag2(name)
          break;
      }
      // 拿到所有aids，通过aids拿出所有meta，这个需要写自己写sql
      const aids = tags.map(tag => tag.aid)
      const metaSql = `SELECT id, CONCAT(title,titleex) AS title FROM diaodiao_article_meta where id in (${aids.join(',')}) AND ${Utils.genTimetopublishInterval()} ORDER BY timetopublish DESC`
      // 此数组已经有顺序，顺序是按照timetopublish从大到小排列
      const metas = await DB.exec(metaSql)
      let slice_aids = null
      // 这儿有逻辑错误，不应该截断aids，应该阶段有顺序的metas
      if(limit !== -1) {
        slice_aids = metas.slice(0, limit).map(meta => meta.id)
      } else {
        slice_aids = metas.map(meta => meta.id)
      }

      let type = 8
      if(!useThumb) {
        type = 2
      }
      let sql = `SELECT url,aid FROM diaodiao_article_image where aid in (${slice_aids.join(',')}) AND type & ${type} = ${type}`
      let images = await DB.exec(sql)
      // limit没必要传，因为这个值就是调用的地方set进去的
      return { metas, images, name }
      // return {metas, images, limit: this.limit, name}
      // console.log(metas)
      // console.log(thumbs);
      // console.log('aids.length:', aids.length)
      // console.log('metas:', metas)
      // console.log(aids.length)
      // return  { metas:  await metaTable.getMetas(aids)}
    } catch (e) {
      console.log(e)
      run.error(e)
    }
  }

}

// const ts = new TagService(100000)
// ts.getTagTree().then(data => console.log(JSON.stringify(data)))

module.exports = TagService
