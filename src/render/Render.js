/**
 * 所有渲染器的父类，封装了所有渲染器需要用到的成员方法和成员属性
 */
const Parser = require('../parser')
const ejs = require('ejs')
class Render {
  constructor (id) {
    // 要渲染的文章
    this.id = id
    // markdown -> html 解析器
    this.parser = new Parser()
    // ejs 模板
    this.ejs = ejs
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
  getData (id = this.id) {

  }
}

module.exports = Render
