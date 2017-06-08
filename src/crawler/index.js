/**
 * 形如：
 *   http://z.diaox2.com/view/app/?m=show&id=8740 的文章
 *  1、request上述url，拿到dom结构
 *  2、解析dom结构，形成markdown
 *  3、markdown入库
 */
// const db = require('21')
// let url = 'http://z.diaox2.com/view/app/?m=show&id=8720'
// let url = 'http://z.diaox2.com/view/app/?m=show&id=8740'
// let url = 'http://z.diaox2.com/view/app/?m=show&id=9649'
const Log = require('../utils/Log')
const Reader = require('./Reader')
// const Downloader = require('./Downloader')
const Parser = require('./Parser')
const Writer = require('./Writer')
// 读取器
const reader = new Reader()
// 下载器
// const downloader = new Downloader()
// 解析器
const parser = new Parser()
// 持久化
const writer = new Writer()
const Promise = require('bluebird')
const request = require('request')
const Utils = require('../utils/Utils')

async function run (file) {
  let id = -1
  try {
    // console.log('run exec .... the file is ', file)
    let content = Utils.getFirst(await reader.read(file))
    if (!content) return
    let { url } = content
    id = content.id
    if (!url || !id) return
    if (id >= 10500) {
      console.log(`[crawler/index.js] 增量更新的文章有ID大于10500的，ID为${id}`)
      Log.business(`[crawler/index.js] 增量更新的文章有ID大于10500的，ID为${id}`)
    }
    let response = await Promise.promisify(request)(url)
    let { body } = response
    console.log(`[STEP1] ${url} 下载成功 ...`)
    content.html = body
    parser.set(content)
    const ret = parser.parse()
    console.log(`[STEP2] ID为 ${id} 的文章parse markdown成功 ...`)
    await writer.write(ret, id)
  } catch (error) {
    console.log(error)
    Log.exception(`[run.js run] ID为 ${id} 插入content表失败：`, error)
  }
}
module.exports = run
