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
  // console.log('run exec .... the file is ', file)
  let content = Utils.getFirst(await reader.read(file))
  if (!content) return
  let {url, id} = content
  if (!url || !id) return
  if (id >= 10500) {
    Log.business(`[crawler/index.js] 增量更新的文章有ID大于10500的，ID为${id}`)
  }
  // console.log(url)
  let response = await Promise.promisify(request)(url)
  let {body} = response
  // console.log(body)
  content.html = body
  // console.log('36:', html)
  parser.set(content)
  const ret = parser.parse()
  // console.log('39:', ret)
  await writer.write(ret, id)
  process.exit(0)
}
module.exports = run
