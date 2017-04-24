const marked = require('marked')
// const _ = require('lodash')
const cheerio = require('cheerio')
/**
 * CMS markdown 解析器
 * 读取文章原始markdown文本
 * 然后解析成相应的数据片段或html片段
 *  1、文章数据片段
 *    目前微信小程序在用这个接口，将来app内也会用
 *    线上格式：https://c.diaox2.com/view/app/wechat/1234.html
 *    格式约定：https://github.com/liaoruoxue/pm2rd/issues/30
 *  2、根据解析出来的数据片段渲染成一段html片段
 */
class Parser {
  /**
   * type = data parse成数据片段
   * type = html parse成html
   * type = all  parse成数据片段和html
   */
  constructor (markdown, options = {}) {
    this._markdown = markdown
    const defaultOptions = {
      // gfm default: false github flavored markdown github风格的markdown
      gfm: true,
      // tables default: true 使用 gfm 风格的表格，想要这个生效，需要设置 gfm 为 true
      tables: true,
      // breaks default: false 使用 gfm 风格的断行（line breaks），想要这个生效，需要设置 gfm 为 true
      breaks: false, // 按一次enter键，还是在一个p标签里，不过使用<br>来换行了，按两次enter键，就变成了两个p标签
      // pedantic default: false 学究式的 尽量遵从markdown.pl的复杂部分，不修复任何markdown的bug和奇怪行为
      pedantic: false,
      // sanitize default: false 净化、清洁  净化输出，忽略html标签。如果设置为true，<span style="color:red;">红</span>将不起作用
      // 将会把 <> 等转义
      sanitize: false,
      // smartLists default: true 使用相对于原始markdown语法智能的表格
      smartLists: true,
      // smartypants default: false 与标点符号有关
      smartypants: false,
      // 提取行内标签内的文本
      ignoreTag: false
    }
    this.options = Object.assign(defaultOptions, options)
    this.options.renderer = new marked.Renderer()
    this.marked = marked
  }
  /**
   * [htmlToData 输入一段html文本，输出一段对应的数据片段]
   * @param  {[jQuery Object]}  container
   * @param  {Boolean} [root=true] [第一次调用 root 为true]
   * @return {[Array]} [返回container下所有字节点的数据片段]
   */
  htmlToData (container, root = true) {
    const contents = []
    let children = null
    const contain = container.get(0)
    // 如果是第一次调用 或者 ul ol等，则取所有的dom节点
    if (root || /ul|ol/.test(contain.name)) {
      children = container.children()
    } else {
      // 否则取所有的节点，包括文本节点
      children = contain.childNodes
    }
    children = Array.from(children)
    for (let child of children) {
      let item = {}
      let {type, name, data, attribs} = child
      // 只处理tag和text节点
      if (type === 'tag') {
        item.type = name
        let childNodes = child.childNodes
        let isImg = false
        if (name === 'img') {
          item.value = attribs.alt || ''
          item.url = attribs.src
          item.width = attribs.width || ''
          item.height = attribs.height || ''
          isImg = true
         } else if (name === 'a') {
           item.url = attribs.href
         } else if (name === 'span' && attribs.style) {
           item.style = attribs.style
         }
        // 若child下有且仅有一个文本节点，则直接把文本节点值赋予value
        if (childNodes.length === 1 && childNodes[0].type === 'text') {
          item.value = childNodes[0].data
        } else if (!isImg) {
          // 若含有其他节点，则递归调用htmlToData
          item.value = this.htmlToData(this.$(child), false)
        }
      } else if (type === 'text') {
        item.type = type
        item.value = data
      }
      contents.push(item)
    }
    return contents
  }

  set markdown (markdown) {
    this._markdown = markdown
  }

  get renderer () {
    return this.options.renderer
  }

  get markdown () {
    return this._markdown
  }

  getData () {
    this.$ = cheerio.load(`
      <div id="container">
        ${this.getHTML()}
      <div>
    `, {
      decodeEntities: false
    })
    return this.htmlToData(this.$('#container'))
  }

  getHTML () {
    const renderer = this.renderer
    //*****************************************自定义markdown语法解析*****************************************
    renderer.heading = (text, level) => {
      return `<h${level}>${text}</h${level}>`
    }
    renderer.codespan = text => `<p class="lift">${text}</p>`
    /**
     * 在段落内，包含行内标签
     *  行内标签包括：
     *   1. a
     *   2. stromg
     *   3. em
     *   4. del
     *   5. span
     */
    renderer.link = (href, text) => {
      if (/^\d+$/.test(href)) {
        href = `//www.diaox2.com/article/${href}.html`
      }
      return `<a target="_blank" href="${href}">${text || href}</a>`
    }
    this.marked.setOptions(this.options)
    return this.marked(this.markdown)
  }

  getAll () {
    return {
      html: this.getHTML(),
      data: this.getData()
    }
  }
  /*
      解析传进来的带标签的字符串，返回去掉标签之后的纯文本
  */
  extractText (summary) {
    if (!summary) {
      return ''
    }
    // 如果传进来的本身就是纯本文，原样返回
    if (!summary.startsWith('<') && !summary.endsWith('>')) {
      return summary
    } else {
      return summary.replace(/</g, '\n<')
        .replace(/>/g, '>\n')
        .replace(/\n\n/g, '\n')
        .replace(/^\n/g, '')
        .replace(/\n$/g, '')
        .split('\n')
        .filter(item => !item.startsWith('<'))
        .join('')
        .replace(/&nbsp;?|<br\s*\/*>|\s*/ig, '')
    }
  }
}

module.exports = Parser

const parser = new Parser(`
这个段落中含有我们的其他文章的链接\n\n这个段落中含有引用非文章链接\n\n技术支持：有问题报给@李彦峰（大哥）
`)
console.log(parser.getHTML())
// console.log(JSON.stringify(parser.getData()))
// console.log(JSON.stringify(parser.getAll()))
