const cheerio = require('cheerio')
const _ = require('lodash')
const Utils = require('../utils/Utils')
// const html = require('./9861.html')
// const Log = require('../utils/Log')
/**
 * 段落与段落之间 用 \n\n 隔开，若一个 \n 则还是在一个p标签里
 *  1. goodthing (type = show)                                http://c.diaox2.com/view/app/?m=show&id=9669
 *  2. firstpage (type = show)                                http://c.diaox2.com/view/app/?m=show&id=5344
 *  3. experience (type = show)                               http://c.diaox2.com/view/app/?m=show&id=1022
 *  4. zhuankan (type = zhuankan) 文章集合                     http://c.diaox2.com/view/app/?m=zk&id=3053
 *  5. zhuanti (type = zhuanti from 7017) 文章集合             http://c.diaox2.com/view/app/?m=zt&id=7080
 *  6. scene (type = scene)线上原来出现过，但是现在没用过了      http://c.diaox2.com/view/app/?m=scene&id=3045
 *   场景页不用考虑，我们以后不用了，并且新老用户都看不到  李园宁 2017-4-19
 *
 * 输入的文章为上述6种类型，但是markdown，为四种
 *  1. show     (goodthing/firstpage/experience)
 *  2. zhuankan (zhuankan)
 *  3. zhuanti  (zhuanti)
 *  4. scene    (scene)
 *
 *  Parser 解析分为3部分：
 *   1. 文章markdown
 *   2. author
 *   3. 所有image
 *
 */
class Parser {
  constructor (content) {
    this.set(content)
  }
  set (content) {
    // console.log('32:', content)
    if (!_.isEmpty(content)) {
      this.content = content
      const { html, type, id, m } = content
      this.html = html
      this.type = type
      this.id = Number(id)
      this.m = m // 根据不同的m来选择相应的解析markdown的方法
      this.$ = cheerio.load(this.html, { decodeEntities: false })
    }
  }
  setImage (img, type = 4) {
    // INSERT INTO image set aid=4925, url='//content.image.alimmdn.com/cms/sites/default/files/20160107/zk/qqq2.jpg', used=1, type=4, extension_name='jpg', width=640, height=416;
    let ret = null
    if (img) {
      let { attribs } = img
      // 优先取不带参数的data-big，并且当文档还没有ready时，取道的有可能是占位图
      let src = attribs['data-big'] || attribs['src']
      let width = +(attribs['data-w'] || attribs['width']) || 0
      let height = +(attribs['data-h'] || attribs['height']) || 0
      // 经过昨晚的测试发现：有些width和height为-1
      // 所以硬编码成 width 和 height
      if (width < 0) {
        width = 596
      }

      if (height < 0) {
        height = 596
      }

      ret = {
        aid: this.id,
        url: Utils.removeProtocolHead(src),
        type,
        used: 1,
        extension_name: Utils.getFileExtension(src),
        // size: '', // 目前我们先不管历史老文章内图片的size，新的文章自会有的
        width,
        height
        // create_time: '' // 目前还无法拿到
      }
    }
    return ret
  }

  getZKMarkdown () {
    let { $ } = this
    let markdown = ''
    let header = $('#head')
    // let title = header.find('#headtitle p').text()
    let zkdesc = header.find('.headdesc').text()
    // let img = header.find('.direct').get(0)
    // const zkImages = (this.zkImages = [])
    // this.zkMeta = { id: this.id, title, ctype: 4 }
    // zkImages.push(this.setImage(img, 1))
    // markdown += `# ${title}\n\n`
    markdown += `zkdesc ${zkdesc}\n\n`
    // markdown += `\`\`\`zk
    //     title: ${title}
    //     desc: ${eds}
    //     image: ![](${img.attribs.src})
    //   \`\`\`\n`
    let zkcards = Array.from($('.card'))
    // let zkarticles = 'zkarticles '
    for (let card of zkcards) {
      const $card = $(card)
      // const title = $card.find('.title').text()
      // const img = $card.find('img')[0]
      // if (!title) continue
      let id = Utils.normalize(card.attribs['data-href'])
      if (!id) continue
      // zkarticles += `${id} `
      markdown += `\`\`\`zkarticle
        id: ${id}
        desc: ${$card.find('.desc').text()}
       \`\`\`\n`
      // zkImages.push(this.setImage(img))
    }
    // console.log(markdown)
    return markdown
  }

  getZTMarkdown () {
    let { $ } = this
    let markdown = ''
    let header = $('.headdesc')
    // let title = header.find('h2').text()
    let desc = header.find('p').text()
    // const ztImages = (this.ztImages = [])
    // this.ztMeta = { id: this.id, title, ctype: 5 }
    // markdown += `# ${title} \n\n`
    // if(title2){
    //   markdown += `## ${title2} \n\n`
    // }
    markdown += `ztdesc ${desc}\n\n`
    // markdown += `\`\`\`zt
    //   title: ${title}
    //   desc: ${title2}
    // \`\`\`\n`
    let ztcards = Array.from($('.ztcard'))
    for (let card of ztcards) {
      const $card = $(card)
      // const title = $card.find('.p1').text()
      // const img = $card.find('.ztleft img')[0]
      const longId = $card.find('.ztright .p3')[0].attribs['data-id']
      // if (!title) continue
      markdown += `\`\`\`ztarticle
        id: ${Utils.toShortId(longId)}
        desc: ${$card.find('.p2').text()}
       \`\`\`\n`
      // `\`\`\` 必须在一行，否则会出错
      // markdown += `\`\`\`card
      //   id: ${longId & 0xffffff}
      //   title: ${title}
      //   desc: ${$card.find('.p2').text()}
      //   image: ![](${img.attribs.src})
      //  \`\`\`\n`
      // ztImages.push(this.setImage(img))
    }
    return markdown
  }

  /**
   * [this.parse 输入一段html，输出对象的markdown]
   * @param  {jQuery Object}   [container]    [要处理的html的跟容器]
   * @param  {Boolean}         [root=true]    [第一次处理根容器下的html标签时，root为true]
   * @param  {String}          [ptype]        [parent type，container的父类型，ptype为标签名]
   * @param  {Boolean}         [isUl]         [标识在blockquote下的li，是否处于ul中]
   * @return {String}          [description]  [输入的html对应的markdown]
   *
   * TODO: 解决blockquoto parse换行问题
   */
  getShowMarkdown (container, root = true, ptype, isUl) {
    // console.log('开始解析html ....')
    const contain = container.get(0)
    if (!contain) return
    let markdown = ''
    let children = null
    let { $ } = this
    // 预处理blockquote start
    const quoteboxs = Array.from(container.find('.quotebox'))
    for (let quotobox of quoteboxs) {
      let $quotobox = this.$(quotobox)
      $quotobox.html($quotobox.find('.box-inner').html().trim())
    }
    // 预处理blockquote end
    // 如果是第一次调用 或者 ul/ol ，则取所有的dom节点
    if (root || /ul|ol|blockquote/.test(contain.name)) {
      children = container.children()
    } else {
      // 否则取所有的节点，包括文本节点
      children = contain.childNodes
    }
    children = Array.from(children)
    const inBlockquoto = ptype === 'blockquote'
    const blockquotePrefix = inBlockquoto ? '> ' : ''
    let md
    for (let child of children) {
      md = ''
      let $child = $(child)
      // type = tag/text/commond ...
      // name = p/a/span/div ... 如果type是text，则name为undefined
      let { attribs, name } = child
      let id = null
      name = this.getName(child)
      if (!name) continue
      let text = this.onlyHasOneTextChild(child)
      let innerText = ''
      if (text !== null) {
        innerText = $child.text().replace(/\n*/, '')
      }
      if (attribs) {
        id = attribs.id
      }
      // console.log('59:', name)
      if (name === 'p') {
        if (text !== null) {
          md += `${id ? 'a' + id + ' ' : ''}${blockquotePrefix}${innerText}\n\n`
        } else {
          md += `${id ? 'a' + id + ' ' : ''}${blockquotePrefix}${this.getShowMarkdown($child, false)}\n\n`
        }
      } else if (name === 'text') {
        // console.log(innerText)
        // 如果是空字符节点，则忽略之
        if (!/^\s*$/.test(innerText)) {
          md += innerText
        }
      } else if (name === 'h2') {
        if (text !== null) {
          md += `## ${id ? 'a' + id + ' ' : ''}${innerText}\n\n`
        } else {
          md += `## ${id ? 'a' + id + ' ' : ''}${this.getShowMarkdown($child, false)}\n\n`
        }
      } else if (name === 'h3') {
        if (text !== null) {
          md += `### ${id ? 'a' + id + ' ' : ''}${innerText}\n\n`
        } else {
          md += `### ${id ? 'a' + id + ' ' : ''}${this.getShowMarkdown($child, false)}\n\n`
        }
      } else if (name === 'ul') {
        // 如果ul在blockquote中，则相对于其下的li，其ptype为blockquote，否则才为ul
        // 因为ul和ol下的li的ptype都为blockquote，所以用第四个参数 isUl 来标识改li处于ul中还是ol中
        md += `${this.getShowMarkdown($child, false, inBlockquoto ? 'blockquote' : ptype === 'li' ? 'blockquote' : 'ul', true)}${inBlockquoto ? '\n' : '\n\n'}`
      } else if (name === 'ol') {
        // 如果ol在blockquote中，则相对于其下的li，其ptype为blockquote，否则才为ol
        md += `${this.getShowMarkdown($child, false, inBlockquoto ? 'blockquote' : ptype === 'li' ? 'blockquote' : 'ol', false)}${inBlockquoto ? '\n' : '\n\n'}`
      } else if (name === 'li') {
        if (ptype === 'ul' || isUl) {
          if (text !== null) {
            md += `${blockquotePrefix} - ${innerText}\n`
          } else {
            md += `${blockquotePrefix} - ${this.getShowMarkdown($child, false, 'li')}\n`
          }
        } else {
          const index = children.indexOf(child) + 1
          if (text !== null) {
            md += `${blockquotePrefix}${inBlockquoto ? '  ' : ''}${index}. ${innerText}\n`
          } else {
            md += `${blockquotePrefix}${inBlockquoto ? '  ' : ''}${index}. ${this.getShowMarkdown($child, false, 'li')}\n`
          }
        }
      } else if (name === 'strong') {
        if (text !== null) {
          md += `**${innerText}**`
        } else {
          md += `**${this.getShowMarkdown($child, false)}**`
        }
      } else if (name === 'em') {
        if (text !== null) {
          md += `*${innerText}*`
        } else {
          md += `*${this.getShowMarkdown($child, false)}*`
        }
      } else if (name === 'del') {
        if (text !== null) {
          md += `~~${innerText}~~`
        } else {
          md += `~~${this.getShowMarkdown($child, false)}~~`
        }
      } else if (name === 'u') {
        if (text !== null) {
          md += `<u>${innerText}</u>`
        } else {
          md += `<u>${this.getShowMarkdown($child, false)}</u>`
        }
      } else if (name === 'a') {
        // console.log('a标签内的文本是：', innerText)
        // console.log('处理之前a标签的href为：', attribs.href)
        // console.log('处理之后a标签的href为：', Utils.normalize(attribs.href))
        // 2017-06-01 开始支持a标签下有img，不然在文章引用测评集合页就不可以了
        // 语法为 [1120 img: http://a.com/sadasda.jpg]
        let img = $child.find('img')[0]
        if (img) {
          md += `[${innerText}](${Utils.normalize(attribs.href)} img: ${img.attribs['data-big'] || img.attribs.src})`
        } else {
          md += `[${innerText}](${Utils.normalize(attribs.href)})`
        }
      } else if (name === 'img') {
        md += `![${attribs.alt}](${attribs['data-big'] || attribs.src})`
      } else if (name === 'span') {
        if (text !== null) {
          md += `<span style="${attribs.style}">${innerText}</span>`
        } else {
          md += `<span style="${attribs.style}">${this.getShowMarkdown($child, false)}</span>`
        }
      } else if (name === 'blockquote') {
        // blockquote 下面的每个段落都用p标签包裹着
        if (text !== null) {
          md += `> ${innerText.trim()}\n`
        } else {
          md += `${this.getShowMarkdown($child, false, 'blockquote')}\n\n`
        }
      } else if (name === 'lift2') {
        // console.log('lift2:', innerText)
        // if (text !== null) {
        md += `lift2 ${innerText}\`\n\n`
        // } else {
          // md += `lift2 ${this.getShowMarkdown($child, false)}\n\n`
        // }
      } else if (name === 'lift') {
        // if (text !== null) {
        //   md += `lift ${innerText}\n\n`
        // } else {
          /**
              此处有BUG，2017-06-01
              应该直接找到lift下面的em，然后取innerText即可，而不要递归
              因为递归会再次处理em，把内容变为 *这是lift的内容*
              递归返回，再加上 `lift` 则markdown的内容变为：lift *这是lift的内容*
              因为在解析markdown的自定义lift语法时，会自动加上em，然后 *这是lift的内容*
              又解析成 em，会导致两层em
              导致解析成的html变为
              <p class="lift">
               <em>
                <em>这是lift的内容</em>
               </em>
              </p>
           */
          // md += `lift ${this.getShowMarkdown($child, false)}\n\n`
        md += `lift ${$child.find('em').text()}\n\n`
        // console.log('lift:', $child.find('em').text())
        // }
      } else if (name === 'sku') {
        md += `sku ${Utils.normalize(attribs['data-href'])}\n\n`
        // console.log($child)
        // let title = $child.find('.articletitle').text()
        // let image = $child.find('.articleimg')[0].attribs['src']
        // let price = $child.find('.brand').text()
        // console.log()
        // console.log($child.find('.articletitle').text())
        // console.log($child.find('.brand').text())
      //   md += `\`\`\`sku
      //   id: ${Utils.normalize(attribs['data-href'])}
      //   title: ${title}
      //   price: ${price}
      //   image: ![](${Utils.removeAliImageSuffix(image)})
      //  \`\`\`\n`
        // md += `\`\`\`sku\n ${Utils.normalize(attribs['data-href'])}\n\`\`\`\n\n`
        // if (text !== null) {
        //   md += `\`\`\`sku\n ${innerText}\n\`\`\`\n\n`
        // } else {
        //   md += `\`\`\`sku\n ${this.getShowMarkdown($child, false)}\n\`\`\`\n\n`
        // }
      } else if (name === 'editorhead') {
        md += `eds ${$child.text()}\n\n`
      } else if (name === 'editorcontent') {
        md += `edsdesc ${this.getShowMarkdown($child, false)}\n\n`
      }
      markdown += md
    }
    // console.log('解析html完毕 ....')
    // console.log('markdown:', markdown)
    return markdown
  }

  /**
    | id               | int(11) unsigned    | NO   | PRI | NULL              | auto_increment              |
    | title            | varchar(255)        | NO   |     |                   |                             |
    | share_title      | varchar(255)        | YES  |     |                   |                             |
    | wx_title         | varchar(255)        | YES  |     |                   |                             |
    | wb_title         | varchar(255)        | YES  |     |                   |                             |
    | ctype            | tinyint(1) unsigned | YES  |     | 0                 |                             |
    | status           | tinyint(1) unsigned | NO   |     | 0                 |                             |
    | create_time      | timestamp           | NO   |     | CURRENT_TIMESTAMP |                             |
    | last_update_time | timestamp           | NO   |     | CURRENT_TIMESTAMP | on update CURRENT_TIMESTAMP |
    | user             | varchar(60)         | YES  |     |                   |                             |
    | lock_by          | varchar(60)         | YES  |     |                   |                             |
    | last_update_by   | varchar(60)         | YES  |     |                   |                             |
    | author           | varchar(60)         | YES  |     |                   |
   */
  /**
    | id              | bigint(20) unsigned  | NO   | PRI | NULL              | auto_increment |
    | aid             | int(11) unsigned     | NO   |     | NULL              |                |
    | url             | text                 | NO   |     | NULL              |                |
    | used            | tinyint(1) unsigned  | NO   |     | 0                 |                |
    | type            | varchar(10)          | NO   |     |                   |                |
    | origin_filename | text                 | NO   |     | NULL              |                |
    | extension_name  | varchar(10)          | NO   |     | NULL              |                |
    | size            | int(10) unsigned     | NO   |     | NULL              |                |
    | width           | smallint(4) unsigned | NO   |     | NULL              |                |
    | height          | smallint(4) unsigned | NO   |     | NULL              |                |
    | create_time     | timestamp            | NO   |     | CURRENT_TIMESTAMP |                |
   */
  parse () {
    // const markdown = this.getMarkdown(this.$('.content'))
    let { m } = this
    let ret = {}
    let markdown = null
    switch (m.toLowerCase()) {
      case 'show':
        markdown = this.getShowMarkdown(this.$('.content')) // 解析 goodthing\firstpage\experience类型的markdown
        break
      case 'zk':
        markdown = this.getZKMarkdown() // 解析 专刊的markdown
        break
      case 'zt':
        markdown = this.getZTMarkdown() // 解析 专题的markdown
        break
    }
    ret.markdown = markdown
    return ret
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
            if (/^lift2$/i.test(className)) {
              name = 'lift2'
            } else if (/^lift$/i.test(className)) {
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

  onlyHasOneTextChild (dom) {
    if (dom.type === 'text') {
      return dom.data
    }
    const childNodes = dom.childNodes
    if (childNodes.length === 1 && childNodes[0].type === 'text') {
      return childNodes[0].data
    }
    return null
  }
}

// const parser = new Parser({
//   id: 6107,
//   m: 'show',
//   type: 'firstpage',
//   html
// })
// console.log(parser.parse())
// parser.parse()

module.exports = Parser
