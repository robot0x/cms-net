const url = require('url')
const appConfig = require('../../config/app')
const moment = require('moment')
const startDate = require('../../config/app').startDate
class Utils {
  static genStarAndEndDateForTimetopublish () {
    return {
      startDate,
      endDate: Number(moment().format('YYYYMMDD'))
    }
  }
  /**
   * @static
   * @param {string} text
   * @returns {object} {isAnchor: boolean, text: string}
   * @memberof Utils
   * 输入一段文本，按照约定好的markdown anchor语法，输出对象
   * 比如 "$$$anchor 这是一段儿文本" 输出 {isAnchor: true, anchor:'anchor', text: '这是一段儿文本'}
   *      "$$$锚点 这是一段儿文本" 输出 {isAnchor: true, anchor:'锚点', text: '这是一段儿文本'}
   *      "$$$锚点 a呵呵 这是一段儿文本" 输出 {isAnchor: true, anchor:'锚点', text: 'a呵呵 这是一段儿文本'}
   *      "这是一段儿文本" 输出 {isAnchor: false, anchor:'', text: '这是一段儿文本'}
   *      "这是一段儿文本" 输出 {isAnchor: false, anchor:'', text: '这是一段儿文本'}
   *      "$$$youdiao <img src="http://content.image.alimmdn.com/cms/sites/default/files/20170517/firstpage/guanyupingce.jpg" alt="">"
   *      输出 {isAnchor: true, anchor:'youdiao', text: '<img src="http://content.image.alimmdn.com/cms/sites/default/files/20170517/firstpage/guanyupingce.jpg" alt="">'}
   */
  static anchorHandler (text) {
    if (!text) return text
    /**
     * 必须是非贪婪的，只匹配到第一个空格即可，不然若后面还有空格，就会出现错误
     * 例如 $$$youdiao <img src="http://content.image.alimmdn.com/cms/sites/default/files/20170517/firstpage/guanyupingce.jpg" alt="">
     * 若是贪婪的，则会一直匹配到 alt="" 前面的空格
     */
    const anchorReg = /^\${3}(.+?) /
    const match = text.match(anchorReg)
    const ret = Object.create(null)
    ret.isAnchor = false
    ret.anchor = ''
    if (match) {
      ret.isAnchor = true
      ret.anchor = match[1]
    }
    ret.text = text.replace(anchorReg, '')
    return ret
  }
  /**
   * @param {string} markdown
   * @returns {array} cidlist
   * @memberof Utils
   * 解析
   * ```card
   *  id:3053
   * ```
   * 然后取出
   *  => 3053
   * 根据cidlist，拿matalist
   */
  // static getCidByMarkdown (markdown) {
  //   const zkarticlesReg = /zkarticles\s+(.+)/
  //   let match = markdown.match(zkarticlesReg)
  //   let ids = []
  //   if (match || match[1]) {
  //     ids = match[1].split(/\s+/)
  //     ids = ids.filter(id => /^\d+$/.test(id)).map(id => Number(id))
  //   }
  //   return ids
  // }
  static getZtDataByParseMarkdown (markdown) {
    const ztdescReg = /^ztdesc\s+/
    const ztdescReg2 = /^ztdesc[\s\S]+?\s+/ig
    const allCardReg = /```ztarticle[\s\S]+?```/ig
    const idReg = /id[:：]\s*(\d+)\s+/
    const descReg = /desc[:：]\s*(.+)\s*/
    const ztdesc = Utils.getFirst(markdown.match(ztdescReg2)).replace(ztdescReg, '').trim()
    let ret = Object.create(null)
    ret.ztdesc = ztdesc
    ret.article = Object.create(null)
    ret.ids = []
    const allCardMarkdown = markdown.match(allCardReg)
    for (let cardMarkdown of allCardMarkdown) {
      let id = cardMarkdown.match(idReg)
      let desc = cardMarkdown.match(descReg) || ['', '']
      if (Utils.isValidArray(id)) {
        id = id[1]
        ret.article[id] = desc[1]
        ret.ids.push(Number(id))
      }
    }
    return ret
  }
  /**
   * @static
   * @param {any} markdown
   * @returns
   * @memberof Utils
   * {
   * zkdesc: '无论是单身狗还是一对汪，一年之中总有那么几个周末想窝在家中，望望天花板，剥剥手指甲，吃吃小食，',
     article: {
      '1047': '无论是数九寒冬还是炎热酷暑，总是需要一桶冰淇淋来填补我们百无聊赖的心。',
      '1138': '除了嘎嘣脆的爆米花，鸡蛋仔也是个不错的选择啊。',
      '1229': '当然了，如果你心灵手巧，瞧不上那些没有营养的小零食，那你就入手一个蒸锅。',
      '1598': '嘴巴空虚寂寞冷怎么办？吃嘎嘣脆的爆米花啊。',
      '2197': '女生嘛，即便宅在家里，还是要注意各种营养。',
      '2717': '男生嘛，肯定要来瓶啤酒潇洒一下，尤其是那口感细腻的啤酒花，绝对不能少。' 
     }
    }
   */
  static getZkDataByParseMarkdown (markdown) {
    try {
      const zkdescReg = /^zkdesc\s+/
      const zkdescReg2 = /^zkdesc[\s\S]+?\s+/ig
      const allCardReg = /```zkarticle[\s\S]+?```/ig
      const idReg = /id[:：]\s*(\d+)\s+/
      const descReg = /desc[:：]\s*(.+)\s*/
      const zkdesc = Utils.getFirst(markdown.match(zkdescReg2)).replace(zkdescReg, '').trim()
      let ret = Object.create(null)
      ret.zkdesc = zkdesc
      ret.article = Object.create(null)
      // 使用一数组，单独防止cid的顺序，否则，cid作为key的话，可能跟编辑的书写顺序是不一致的
      ret.ids = []
      const allCardMarkdown = markdown.match(allCardReg)
      for (let cardMarkdown of allCardMarkdown) {
        let id = cardMarkdown.match(idReg)
        let desc = cardMarkdown.match(descReg) || ['', '']
        if (Utils.isValidArray(id)) {
          id = id[1]
          ret.article[id] = desc[1]
          ret.ids.push(Number(id))
        }
      }
      return ret
    } catch (error) {
      console.log(error)
      return null
    }
  }
  // static getCidByMarkdown (markdown) {
  //   const idReg = /id[:：]\s*(\d+)\s+/
  //   const allCardReg = /```zkarticle[\s\S]+?```/ig
  //   const allCardMarkdown = markdown.match(allCardReg)
  //   console.log(allCardMarkdown)
  //   const ret = []
  //   for (let cardMarkdown of allCardMarkdown) {
  //     let id = cardMarkdown.match(idReg)
  //     if (Utils.isValidArray(id)) {
  //       ret.push(Number(id[1]))
  //     }
  //   }
  //   return ret
  // }
  static isAliImage (url = '') {
    return /content\.image\.alimmdn\.com/i.test(url)
  }
  static removeAliImageSuffix (url, suffix = '@200w_200h_1e%7C200x200-5rc') {
    if (
       Utils.isAliImage(url) && url.indexOf(suffix) !== -1
    ) {
      return url.substring(0, url.lastIndexOf('@'))
    }
    return url
  }
  // 如果是阿里云图，则加上后缀，否则不用处理
  static addAliImageSuffix (url, suffix = '@200w_200h_1e%7C200x200-5rc') {
    if (
       Utils.isAliImage(url) && url.indexOf(suffix) === -1
    ) {
      url += suffix
    }
    return url
  }
  /**
   * 正文页的图片需要加上@768w_1l后缀，这样在图片质量没有损失的情况下，
   * size平均会减少50%，节省用户流量、省电、减少发热、提高页面加载速度
   * 例如：http://content.image.alimmdn.com/cms/sites/default/files/20170519/firstpage/xuanpin.jpeg
   * 这个图片，原始大小为1.8M，加上后缀，大小为471KB，极大地减小了尺寸
   */
  static addImageOfShowPageAliImageSuffix (url, suffix = '@768w_1l') {
    // 如果是gif，就不用加后缀，否则gif将会变成jpg
    if (
       !/gif/i.test(Utils.getFileExtension(url)) && Utils.isAliImage(url) && url.indexOf(suffix) === -1
    ) {
      url += suffix
    }
    return url
  }
  /*
   取meta时，要给所有的where条件加上时间限制
   */
  static genTimetopublishInterval (col = 'timetopublish', debug = false) {
    // console.log('Utils.genTimetopublishInterval debug:', debug)
    // 从 [20141108, 今天] 的数据，即截止到今天
    // between ... and ... 包含边界值
    // return ` (${col} BETWEEN 20141106 AND ${Number(moment()
    //     .add(1, 'days')
    //     .format('YYYYMMDD'))}) `
    let {startDate, endDate} = Utils.genStarAndEndDateForTimetopublish()
    let interval = ` (${col} BETWEEN ${startDate} AND ${endDate}) `
    if (debug) {
      interval = ' 1=1 '
    }
    return interval
  }

  // 把sku的形如：http://c.diaox2.com/view/app/sku/8383.html
  // 转换为     ：http://c.diaox2.com/view/app/sku/41987600295472/8383.html
  static convertSkuUrl (buylink, id) {
    // console.log('[Utils.convertSkuUrl] input  is:', buylink)
    //  如果有购买链接且购买链接是sku页，则需要转成 /sku/longid/sid.html这种形式，用来进行统计
    if (/\/sku\//i.test(buylink)) {
      let mSkuReg = /\/sku\/(?:\d+\/)?(\d+)\.html/
      let match = buylink.match(mSkuReg)
      let sid = match[1]
      buylink = `//c.diaox2.com/view/app/sku/${Utils.toLongId(id)}/${sid}.html`
    }
    //  console.log('[Utils.convertSkuUrl] output is:', buylink)
    return buylink
  }
  static addUrlPrefix (url) {
    if (!url) return null
    if (!/^(https?:)?\/\//.test(url)) {
      url = appConfig.CDIAOX2 + url
    }
    return url
  }
  static toShortId (ids) {
    const factor = 4294967297 // Math.pow(2, 32) + 1
    const factor2 = 0xffffff
    const numReg = /^\d+$/
    let ret = null
    if (Utils.isValidArray(ids)) {
      ret = []
      for (let id of ids) {
        if (numReg.test(id)) {
          if (id >= factor) {
            ret.push(id & factor2)
          } else {
            ret.push(id)
          }
        }
      }
    } else if (numReg.test(ids)) {
      if (ids >= factor) {
        ret = ids & factor2
      } else {
        ret = ids
      }
    }
    return ret
  }

  static toLongId (ids) {
    const factor = 4294967297 // Math.pow(2, 32) + 1
    const numReg = /^\d+$/
    let ret = null
    if (Utils.isValidArray(ids)) {
      ret = []
      for (let id of ids) {
        if (numReg.test(id)) {
          if (id < factor) {
            ret.push(id * factor)
          } else {
            ret.push(id)
          }
        }
      }
    } else if (numReg.test(ids)) {
      if (ids < factor) {
        ret = ids * factor
      } else {
        ret = ids
      }
    }
    return ret
  }

  // 获取数组中第一个元素
  static getFirst (data) {
    if (Utils.isValidArray(data)) {
      [data] = data
    } else {
      data = null
    }
    return data
  }

  static ctypeToM (ctype) {
    ctype = Number(ctype)
    // console.log(ctype)
    // 1-首页/2-好物/3-专刊/4-活动/5-经验/7-值得买/8-评测/9-专题
    let m = ''
    switch (ctype) {
      case 1:
        m = 'show'
        break
      case 2:
        m = 'show'
        break
      case 3:
        m = 'zk'
        break
      case 4:
        m = 'show'
        break
      case 5:
        m = 'show'
        break
      case 7:
        m = 'zdm'
        break
      case 8:
        m = 'ceping'
        break
      case 9:
        m = 'zt'
        break
      default:
        m = null
    }
    return m
  }
  static typeToCtype (type) {
    // 1-首页/2-好物/3-专刊/4-活动/5-经验/7-值得买/8-评测/9-专题
    let ctype = 0
    switch (type) {
      case 'firstpage':
        ctype = 1
        break
      case 'goodthing':
        ctype = 2
        break
      case 'zhuankan':
        ctype = 3
        break
      case 'activity':
        ctype = 4
        break
      case 'experience':
        ctype = 5
        break
      // case 'zdm':
      //   ctype = 7
      //   break
      // case 'ceping':
      //   ctype = 8
      //   break
      case 'zhuanti':
        ctype = 9
        break
    }
    return ctype
  }
  static ctypeToType (ctype) {
    ctype = Number(ctype)
    // 1-首页/2-好物/3-专刊/4-活动/5-经验/7-值得买/8-评测/9-专题
    let type = ''
    switch (ctype) {
      case 1:
        type = 'firstpage'
        break
      case 2:
        type = 'goodthing'
        break
      case 3:
        type = 'zhuankan'
        break
      case 4:
        type = 'activity'
        break
      case 5:
        type = 'experience'
        break
      case 7:
        type = 'zdm'
        break
      case 8:
        type = 'ceping'
        break
      case 9:
        type = 'zhuanti'
        break
      default:
        type = 'nothing'
    }
    return type
  }
  static isValidArray (array) {
    return array && Array.isArray(array) && array.length > 0
  }
  /**
   * 如果输入的是我们自己的链接
   *   形如：/view/app/?m=show&id=9625                              返回 9625
   *   形如：diaox2.com/article/9625.html                           返回 9625
   *   形如：cms/diaodiao/articles/9625#1                           返回 9625#1
   *   形如：http://c.diaox2.com/view/app/sku/8509.html             返回 8509
   *   形如：http://c.diaox2.com/view/app/sku/12312312312/8509.html 返回 8509
   *   形如：http://c.diaox2.com/view/app/?m=sku&sid=8509           返回 8509
   *  其他url原样返回
   */
  static normalize (src) {
    if (!src) return src
    let { host, hash } = url.parse(src, true, true)
    /**
     * 如果 host 为null，则一定是我们自己的url
     * 如果 host 中含有下列一种子串：
     *   1. diaox2.com
     *   2. 42.96.166.118
     *   3. s2.a.dx2rd.com
     *  则也一定是我们自己的url
     *
     */
    // let viewAppReg = /\/view\/app\/\?m=(?:show|zk|scene)&id=(\d+)?(&ch=goodthing)?/i
    // let cmsDiaoReg = /\/cms\/diaodiao\/articles\/(?:goodthing|firstpage|experience|weekend)\/\d+_(\d+)?\.html/i
    // console.log(host)
    let ret = ''
    if (/null|diaox2\.com|s2\.a\.dx2rd\.com|42\.96\.166\.118/.test(host)) {
      hash = hash || ''
      // /view/app/?m=show&id=2
      // /view/app/?m=show&amp;id=2 没有考虑到这种情况
      let viewAppReg = /view\/app\/\?m=\w+(?:&|&amp;)id=(\d+)?(?:&ch=goodthing)?/i
      let cmsDDReg = /cms\/diaodiao\/articles\/\w+\/\d+_(\d+)?\.html/i
      let pcSiteReg = /article\/(\d+)\.html/i
      let shareReg = /share\/(\d+)\.html/i
      // let skuReg = /view\/app\/sku(?:\/\d+)?\/(\d+)\.html/i
      // 'http://c.diaox2.com/view/app/sku/1232131/8509.html'
      // 'http://c.diaox2.com/view/app/sku/8509.html'
      // 'http://c.diaox2.com/view/app/?m=sku&sid=1120'
      let skuReg = /view\/app\/(?:sku(?:\/\d+)?\/(\d+)\.html|\?m=sku&sid=(\d+))/i
      let pcollectionReg = /view\/app\/\?m=pcollection/i
      let match = null
      let isSku = false
      if ((match = src.match(viewAppReg))) {
        ret = match[1]
        if (ret == 7216) {
          ret = 'pcollection'
        }
      } else if ((match = src.match(cmsDDReg))) {
        ret = match[1]
      } else if ((match = src.match(pcSiteReg))) {
        ret = match[1]
      } else if ((match = src.match(shareReg))) {
        ret = match[1] & 0xffffff
      } else if ((match = src.match(skuReg))) {
        ret = match[1] || match[2]
      } else if ((match = src.match(pcollectionReg))) {
        ret = 'pcollection'
      }
      if (ret && !isSku) {
        ret += '' + hash
      }
    }
    return ret || src
  }

  /**
   * 判断一个url是否包含 形如 http:// or https:// or // 协议头
   */
  static hasProtocol (url) {
    return url && /^(https?:)?\/\//i.test(url)
  }
  /**
   * 输入形如：
   *  1. //content.image.alimmdn.com/cms/sites/default/files/20160122/experience/kk.jpg
   *  2. http://content.image.alimmdn.com/cms/sites/default/files/20141014/firstpage/coffeelast.jpg
   *  3. https://content.image.alimmdn.com/cms/sites/default/files/20150120/experience/0_0.jpg
   * 输出：
   *  1. content.image.alimmdn.com/cms/sites/default/files/20160122/experience/kk.jpg
   *  2. content.image.alimmdn.com/cms/sites/default/files/20141014/firstpage/coffeelast.jpg
   *  3. content.image.alimmdn.com/cms/sites/default/files/20150120/experience/0_0.jpg
   */
  static removeProtocolHead (url) {
    try {
      // 如果url不存在或者不是以 http:// or https:// or // 开头，则直接返回url
      if (!Utils.hasProtocol(url)) {
        return url
      }
      url = url.replace(/^(https?:)?\/\//i, '')
      return url
    } catch (e) {
      return url
    }
  }
  // 获取文件扩展名
  // http://leftstick.github.io/tech/2016/04/23/how-to-get-the-file-extension-more-efficiently
  static getFileExtension (filename = '') {
    // 形如 content.image.alimmdn.com/sku/1492441129999184_jpg.jpeg@200w_200h_1e%7C200x200-5rc ，的url，得到的扩展名为jpeg@200w_200h_1e%7C200x200-5rc，显然是有问题的
    const extensionName = filename.slice(
      ((filename.lastIndexOf('.') - 1) >>> 0) + 2
    )
    if (extensionName && extensionName.indexOf('@') !== -1) {
      return extensionName.split('@')[0]
    }
    return extensionName
  }
}
// console.log(
//   Utils.getCidByMarkdown(
//     `zkdesc 无论是单身狗还是一对汪，一年之中总有那么几个周末想窝在家中，望望天花板，剥剥手指甲，吃吃小食，看看电视，度过一天。所以啊，小食很重要，样样不能少！怎么做？且听我慢慢道来。

// \`\`\`zkarticle
//         id: 2717
//         desc: 男生嘛，肯定要来瓶啤酒潇洒一下，尤其是那口感细腻的啤酒花，绝对不能少。别再依靠土掉渣的晃动酒瓶子，来弄点儿少得可怜的啤酒花。试试电动打泡器，分分钟尽情享用爽口的啤酒。
//        \`\`\
// \`\`\`zkarticle
//         id: 2197
//         desc: 女生嘛，即便宅在家里，还是要注意各种营养。买几袋鲜奶，用上酸奶机，自己做个天然酸奶。周末便能窝在沙发上，边喝酸奶边看真人秀啦！
//        \`\`\
// `
//   )
// )
// console.log(Utils.removeAliImageSuffix('//content.image.alimmdn.com/sku/1494687634em_pic_jpg.jpeg@200w_200h_1e%7C200x200-5rc'))
// console.log(Utils.normalize('http://c.diaox2.com/view/app/?m=show&id=9625'))
// console.log(Utils.normalize('http://c.diaox2.com/share/41339060233625.html?from=timeline&isappinstalled=1'))
// console.log(Utils.normalize('http://c.diaox2.com/share/41339060233625.html'))
// console.log(Utils.normalize('http://www.diaox2.com/article/9625.html'))
// console.log(Utils.normalize('cms/diaodiao/articles/goodthing/9625_9625.html'))
// console.log(Utils.normalize('baidu.com'))
// console.log(Utils.normalize('diaox2.com'))
// console.log(Utils.normalize('http://diaox2.com'))
// console.log(Utils.normalize('http://diaox2.com#1'))
// console.log(Utils.normalize('http://c.diaox2.com/view/app/?m=show&id=9625#a'))
// console.log(Utils.normalize('http://c.diaox2.com/view/app/?m=show&id=9625#111'))
// console.log(Utils.normalize('/view/app/sku/8060.html'))
// console.log(Utils.normalize('/view/app/?m=show&amp;id=9833#kepu'))
// console.log(Utils.normalize('http://c.diaox2.com/view/app/sku/1232131/8509.html'))
// console.log(Utils.normalize('http://c.diaox2.com/view/app/sku/8509.html'))
// console.log(Utils.normalize('http://c.diaox2.com/view/app/?m=sku&sid=1120'))
// console.log(Utils.normalize('http://c.diaox2.com/view/app/?m=pcollection'))
// console.log(Utils.normalize('/view/app/?m=pcollection'))
// console.log(Utils.normalize('/view/app/?m=show&id=7216'))
// console.log(Utils.normalize('view/app/?m=show&id=7216'))

/**
   * @static
   * @param {string} text
   * @returns {object} {isAnchor: boolean, text: string}
   * @memberof Utils
   * 输入一段文本，按照约定好的markdown anchor语法，输出对象
   * 比如 'aanchor 这是一段儿文本' 输出 {isAnchor: true, anchor:'anchor', text: '这是一段儿文本'}
   *      'a锚点 这是一段儿文本' 输出 {isAnchor: true, anchor:'锚点', text: '这是一段儿文本'}
   *      'a锚点 a呵呵 这是一段儿文本' 输出 {isAnchor: true, anchor:'锚点', text: 'a呵呵 这是一段儿文本'}
   *      '这是一段儿文本' 输出 {isAnchor: false, anchor:'', text: '这是一段儿文本'}
   *      '$$$youdiao <img src="http://content.image.alimmdn.com/cms/sites/default/files/20170517/firstpage/guanyupingce.jpg" alt="">'
   */
// console.log(Utils.anchorHandler('$$$youdiaozhixuan 有调之选'))
// console.log(Utils.anchorHandler('$$$anchor 这是一段儿文本'))
// console.log(Utils.anchorHandler('AKG 这是一段儿文本'))
// console.log(Utils.anchorHandler('$$$锚点 这是一段儿文本'))
// console.log(Utils.anchorHandler('$$$锚点 a呵呵 这是一段儿文本'))
// console.log(Utils.anchorHandler('这是一段儿文本'))
// console.log(Utils.anchorHandler('AKG爱科技头戴式监听耳机K812，<span style="color:#B22222;">5989元</span>（参考价：8999元）'))
// console.log(Utils.anchorHandler('$$$youdiao ![](http://content.image.alimmdn.com/cms/sites/default/files/20170517/firstpage/guanyupingce.jpg)'))
// console.log(Utils.anchorHandler('$$$youdiao <img src="http://content.image.alimmdn.com/cms/sites/default/files/20170517/firstpage/guanyupingce.jpg" alt="">'))

// console.log(Utils.genStarAndEndDateForTimetopublish())
// const lcids = [4294967297, 41201621280121, 39423504819163, 39423504819163, '', NaN, 41205916247418, 3563]
// const lcid = 4647154615354
// const scids = [9686, 9685, 9684, 2112, 1, Number, 41201621280121]
// const scid = 1214
// console.log(Utils.toShortId(lcids))
// console.log(Utils.toShortId(lcid))
// console.log(Utils.toShortId(scids))
// console.log(Utils.toShortId(scid))
// console.log(Utils.toLongId(lcids))
// console.log(Utils.toLongId(lcid))
// console.log(Utils.toLongId(scids))
// console.log(Utils.toLongId(scid))

// console.log(Utils.convertSkuUrl('http://c.diaox2.com/view/app/sku/8383.html', 7080))
// console.log(Utils.convertSkuUrl('http://c.diaox2.com/view/app/?m=buy&aid=1598', 7080))
// console.log(Utils.convertSkuUrl('http://c.diaox2.com/view/app/sku/1047/259.html', 7080))
console.log(Utils.addImageOfShowPageAliImageSuffix('content.image.alimmdn.com/cms/sites/default/files/20170612/firstpage/touq.gif', void 0, 'gif'))
module.exports = Utils
