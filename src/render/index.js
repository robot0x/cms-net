/**
 * 所有渲染器的父类，封装了所有渲染器需要用到的成员方法和成员属性
 */
const ejs = require('ejs')
const fs = require('fs')
const appConfig = require('../../config/app')

class Render {
  constructor () {
    this.version = appConfig.renderVersion
    // ejs 模板
    this.ejs = ejs
    this.downloadAddr = 'http://a.app.qq.com/o/simple.jsp?pkgname=com.diaox2.android&amp;g_f=991653'
    this.prefix = appConfig.CDIAOX2
  }

  setResponse (res) {
    this.res = res
    return this
  }
  /**
   * 根据id拿到所渲染文章的
   *  1. meta
   *    a. cover图
   *    b. coverex图
   *    c. swipe图
   *    d. author信息
   *  2. 文本内容
   */
  // getData () {
  //   const {m} = this
  //   if(/author/i.test(m)){
  //     const service = new AuthorService(this.src)
  //     return new Promise(async (resolve, reject) => {
  //        try {
  //          resolve(await service.getRenderData())
  //        } catch (e) {
  //          runLogger.error(e)
  //        }
  //     })
  //   } else if(/tag/i.test(m)){
  //       const service = new TagService(this.src)
  //       return new Promise(async (resolve, reject) => {
  //          try {
  //            resolve(await service.getRenderData())
  //          } catch (e) {
  //            runLogger.error(e)
  //          }
  //       })
  //   } else if (/show|zk|zt/i.test(m)){
  //     const service = new MetaService(this.id)
  //     return new Promise(async (resolve, reject) => {
  //        try {
  //          resolve(await service.getRenderData())
  //        } catch (e) {
  //          runLogger.error(e)
  //        }
  //     })
  //   }
  // }

  /**
   * 读取模板文件
   */
  readTemplate (file) {
    return String(fs.readFileSync(file))
  }
  /**
   * 返回根据模板和数据编译好的html文档
   */
  getDoc (template, data) {
    return ejs.render(template, data)
  }
}

module.exports = Render
