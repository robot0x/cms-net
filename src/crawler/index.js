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
const Downloader = require('./Downloader')
const Parser = require('./Parser')
const Writer = require('./Writer')
const path = require('path')
// 读取器
const reader = new Reader()
// 下载器
const downloader = new Downloader()
// 解析器
const parser = new Parser()
// 持久化
const writer = new Writer()

function run (file) {
  // console.log('run exec .... the file is ', file)
  reader.read(file).then(contents => {
    // console.log(contents)
    try {
      // console.log(contents.map(content => content.url))
      // 文件下载器
      const urls = contents
        .filter(content => !!content)
        .map(content => content.url)
      downloader.set(urls)
      downloader
        .download((html, url, index) => {
          const content = contents[index]
          const { id } = content
          if (id >= 10500) {
            return Log.exception(`[crawler/index.js] 增量更新的文章有ID大于10500的，ID为${id}`)
          }
          content.html = html
          // console.log('36:', html)
          parser.set(content)
          const ret = parser.parse()
          // console.log('39:', ret)
          writer.write(ret, id)
          // console.log(`${index}：${url}`)
        })
        .catch(e => {
          console.log(e)
          Log.exception(e)
        })
    } catch (e) {
      console.log(e)
      Log.exception(e)
    }
  })
}
// run(path.resolve('./src/crawler/data', 'ajson.5'))
module.exports = run
