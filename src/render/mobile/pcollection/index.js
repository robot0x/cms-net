const DB = require('../../../db/DB')
const Render = require('../../')
const Utils = require('../../../utils/Utils')

class PCollectionRender extends Render {
  constructor () {
    super()
    console.log('PCollectionRender 被实例化 ...')
    this.template = this.readTemplate(__dirname + '/pcollection.ejs')
  }
  /**
    目录
    7352,买买买,评测必败清单

    最新报告
    9829,有调评测,遮阳伞
    9833,有调评测，防晒霜

    你离女神只差这一步
    6904,评测团,可撕指甲油
    6782,有调评测,脱毛产品
    6149,评测团,身体乳
    7999,评测团,磨砂膏
    2998,有调评测,梳子
    8497,有调评测,电吹风
    9270,有调评测,卫生巾
    6676,评测团,无肩带内衣
    6487,评测团,无痕内衣
    6345,评测团,女士无痕内裤
    7375,评测团,女士纯棉内裤
    7877,评测团,丝袜
    9829,有调评测,遮阳伞
    9833,有调评测，防晒霜
    =>
    {
        '目录': [
            {
                id: 7352,
                title: '',
                cover: '',
                flag: '买买买',
                desc: '评测必败清单'
            }
        ],
        '最新报告': [
            {
                id: 9829,
                flag: '有调评测',
                desc: '遮阳伞'
            },
            {
                id: 9833,
                flag: '有调评测',
                desc: '防晒霜'
            }
        ]
    }
   */
  async parse (text = '') {
    text = text.trim()
    // console.log(text)
    const separator = /\n+\s+/
    const ret = Object.create(null)
    let list = text.split(separator)
    let ids = []
    ret.order = []
    for (let cate of list) {
      `最新报告\n9829,有调评测,遮阳伞\n9833,有调评测，防晒霜`
      let array = cate.split(/\n/)
      let [cateName] = array
      ret.order.push(cateName)
      ret[cateName] = []
      for (let i = 1, l = array.length; i < l; i++) {
        let info = array[i]
        let infoSplit = info.split(/\s*,\s*/)
        let [id, flag, desc] = infoSplit
        id = Number(id)
        flag = flag || ''
        desc = desc || ''
        if (id) {
          ids.push(id)
          ret[cateName].push({
            id,
            flag,
            desc
          })
        }
      }
    }
    let sql = `
    SELECT 
       meta.id AS id, 
       meta.title AS title,
       image.url AS url
      FROM 
       diaodiao_article_meta 
      AS
       meta
      LEFT JOIN 
       diaodiao_article_image AS image
      ON
       meta.id = image.aid AND (image.type & 2 = 2)
      WHERE
       meta.id in (${ids.join(',')})`
    let results = await DB.exec(sql)
    let keys = Object.keys(ret)
    for (let res of results) {
      let { id, title, url } = res
      for (let key of keys) {
        let list = ret[key]
        list.forEach((item, index) => {
          if (item.id == id) {
            list.splice(
              index,
              1,
              Object.assign(item, {
                title,
                cover: '//' + url
              })
            )
          }
        })
        ret[key] = list
      }
    }
    // console.log(ret)
    // console.log(list)
    // console.log(list.length)
    return ret
  }
  async getRendeData () {
    const res = Utils.getFirst(
      await DB.exec(
        `
      SELECT 
       meta.id AS id, 
       meta.title AS title,
       text.content AS content,
       image.url AS url
      FROM 
       diaodiao_article_meta 
      AS
       meta
      LEFT JOIN
       diaodiao_article_content AS text
      ON
       meta.id = text.aid
      LEFT JOIN 
       diaodiao_article_image AS image
      ON
       meta.id = image.aid AND (image.type & 2 = 2)
      WHERE
       meta.ctype = 10
    `
      )
    )
    if (!res) return
    // console.log(res)
    let ret = Object.create(null)
    ret.meta = Object.create(null)
    ret.meta.id = res.id
    ret.meta.title = res.title
    ret.meta.cover = '//' + res.url
    ret.contents = await this.parse(res.content)
    // console.log(ret)
    return ret
  }
  async rende () {
    let data = await this.getRendeData()
    let {meta, contents} = data
    console.log(contents)
    return this.getDoc(this.template, {
      meta,
      contents,
      prefix: this.prefix,
      version: this.version
    })
  }
}
// const pcr = new PCollectionRender()
// pcr.rende()
module.exports = PCollectionRender
