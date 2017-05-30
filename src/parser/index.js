const marked = require('marked')
const _ = require('lodash')
const cheerio = require('cheerio')
const Utils = require('../utils/Utils')
const Log = require('../utils/Log')
// const Promise = require('bluebird')
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
    this.defaultOptions = {
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
      ignoreTag: false,
      promise: false
    }
    this.setOptions(options)
    this.renderer = this.options.renderer = new marked.Renderer()
    this.marked = marked
  }
  setOptions (options = {}) {
    this.options = Object.assign(this.defaultOptions, options)
  }
  getName (child) {
    let { name, attribs, type } = child
    if (type === 'text') {
      return 'text'
    } else if (type === 'tag') {
      let className = attribs.class
      try {
        if (name === 'p') {
          if (_.isEmpty(attribs)) {
            name = 'p'
          } else if (className) {
            if (className.indexOf('lift2') !== -1) {
              name = 'lift2'
            } else if (className.indexOf('lift') !== -1) {
              name = 'lift'
            } else if (className.indexOf('editorhead') !== -1) {
              name = 'editorhead'
            } else if (className.indexOf('editorcontent') !== -1) {
              name = 'editorcontent'
            }
          }
        } else if (name === 'div') {
          const className = attribs.class
          if (className) {
            if (className.indexOf('quotebox') !== -1) {
              name = 'blockquote'
            } else if (className.indexOf('articlecard') !== -1) {
              name = 'sku'
            }
          } else {
            name = null
          }
        }
      } catch (e) {
        console.log(e)
        name = null
      }
    }
    // 可能还有其他的节点，所以我们无法假设只有tag节点和text节点
    return name
  }
  /**
   * [htmlToData 输入一段html文本，输出一段对应的数据片段]
   * @param  {[jQuery Object]}  container
   * @param  {Boolean} [root=true] [第一次调用 root 为true]
   * @return {[Array]} [返回container下所有字节点的数据片段]
   */
  htmlToData (container, root = true) {
    const contents = []
    try {
      let children = null
      const contain = container.get(0)
      // 如果是第一次调用 或者 ul/ol ，则取所有的dom节点
      if (root || /ul|ol/.test(contain.name)) {
        children = container.children()
      } else {
        // 否则取所有的节点，包括文本节点
        children = contain.childNodes
      }
      children = Array.from(children)
      // 不递归的元素
      let notRecursion = ['sku', 'lift', 'blockquote']
      for (let child of children) {
        let item = {}
        let { type, data, attribs } = child
        if (!type) continue
        let $child = this.$(child)
        let name = this.getName(child)
        // 只处理tag和text节点
        if (type === 'tag') {
          item.type = name
          let childNodes = child.childNodes
          if (name === 'a') {
            const { href } = attribs
            const id = Utils.normalize(href)
            item.url = id
            item.scheme = 'diaodiao'
            // 9833#jieguo
            // #jieguo
            if (/^(\d+)?#.+$/.test(href)) {
              item.url = href.substring(href.lastIndexOf('#'))
              item.scheme = 'anchor'
            } else if (/* 9833 */ href === id && !/^\d+$/.test(id)) {
              item.url = Utils.removeProtocolHead(href)
              item.scheme = /^https/i.test(href) ? 'https' : 'http'
            }
          } else if (name === 'span' && attribs.style) {
            item.style = attribs.style
          } else if (name === 'sku') {
            try {
              let title = $child.find('.articletitle').text()
              let image = $child.find('.articleimg')[0].attribs['src']
              let price = $child.find('.brand').text()
              let id = Utils.normalize($child[0].attribs['data-href'])
              item.type = name
              item.id = id
              item.title = title
              item.price = price
              item.image = image
            } catch (error) {
              Log.exception(error)
              console.log(error)
            }
          } else if (name === 'editorhead') {
            item.type = name
            item.value = $child.text()
          } else if (name === 'editorcontent') {
            item.type = name
            item.value = this.htmlToData(this.$(child), false)
          } else if (name === 'lift') {
            try {
              item.type = name
              item.value = $child.find('em').text()
            } catch (error) {
              Log.exception(error)
              console.log(error)
            }
          } else if (name === 'lift2') {
            try {
              item.type = name
              item.value = $child.text()
            } catch (error) {
              Log.exception(error)
              console.log(error)
            }
          } else if (name === 'blockquote') {
            // console.log($child.find('.box-inner'))
            item.type = name
            item.value = this.htmlToData($child.find('.box-inner'), true)
          }
          const doms = Array.from($child.children())
          // 若child下有且仅有一个文本节点，则直接把文本节点值赋予value
          if (childNodes.length === 1 && childNodes[0].type === 'text') {
            item.value = childNodes[0].data
          } else if (doms.length === 1 && doms[0].name === 'img') {
            // 若含有其他节点，则递归调用htmlToData
            let [imgDom] = doms
            let imgAttr = imgDom.attribs
            item.type = imgDom.name
            item.value = imgAttr.alt || ''
            item.url = imgAttr.src
            item.width = imgAttr.width || ''
            item.height = imgAttr.height || ''
          } else if (notRecursion.indexOf(name) === -1) {
            // 若含有其他节点，则递归调用htmlToData
            item.value = this.htmlToData(this.$(child), false)
          }
        } else if (type === 'text') {
          item.type = type
          item.value = data
        }
        if (!_.isEmpty(item)) {
          contents.push(item)
        }
      }
    } catch (error) {
      Log.exception(error)
    }
    return contents
  }

  set markdown (markdown) {
    this._markdown = markdown
  }

  get markdown () {
    return this._markdown
  }

  set html (html) {
    this._html = html
  }

  get html () {
    return this._html
  }

  getRenderer () {
    return this.options.renderer
  }

  setRenderer (renderer) {
    this.renderer = renderer
  }

  getData () {
    this.$ = cheerio.load(`<div id="container">${this.html}<div>`, {
      decodeEntities: false
    })
    return this.htmlToData(this.$('#container'))
  }

  getText () {
    let html = null
    try {
      html = this.getHTML()
      this.$ = cheerio.load(`<div id="text-container">${html}<div>`, {
        decodeEntities: false
      })
      return this.$('#text-container').text()
    } catch (error) {
      console.log(error)
      Log.exception(error)
      return ''
    }
  }

  getHTML () {
    this.marked.setOptions(this.options)
    this.html = this.marked(this.markdown)
    return this.html
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
      return summary
        .replace(/</g, '\n<')
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

// const parser = new Parser(`
// 这个段落中含有我们的其他文章的链接\n\n这个段落中含有引用非文章链接\n\n技术支持：有问题报给@李彦峰（大哥）
// `)
// console.log(parser.getHTML())
// console.log(JSON.stringify(parser.getData()))
// console.log(JSON.stringify(parser.getAll()))
