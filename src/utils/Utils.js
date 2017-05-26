const url = require('url')
const appConfig = require('../../config/app')
const moment = require('moment')

class Utils {
  /**
   * @static
   * @param {string} text
   * @returns {object} {isAnchor: boolean, text: string}
   * @memberof Utils
   * 输入一段文本，按照约定好的markdown anchor语法，输出对象
   * 比如 "aanchor 这是一段儿文本" 输出 {isAnchor: true, anchor:'anchor', text: '这是一段儿文本'}
   *      "a锚点 这是一段儿文本" 输出 {isAnchor: true, anchor:'锚点', text: '这是一段儿文本'}
   *      "a锚点 a呵呵 这是一段儿文本" 输出 {isAnchor: true, anchor:'锚点', text: 'a呵呵 这是一段儿文本'}
   *      "这是一段儿文本" 输出 {isAnchor: false, anchor:'', text: '这是一段儿文本'}
   */
  static anchorHandler (text) {
    if (!text) return text
    const anchorReg = /^a(.+?)\s+/i
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
  static getCidByMarkdown (markdown) {
    const idReg = /id[:：]\s*(\d+)\s*title[:：]/
    const allCardReg = /```card[\s\S]+?```/ig
    const allCardMarkdown = markdown.match(allCardReg)
    const ret = []
    for (let cardMarkdown of allCardMarkdown) {
      let id = cardMarkdown.match(idReg)
      if (Utils.isValidArray(id)) {
        ret.push(Number(id[1]))
      }
    }
    return ret
  }
  static removeAliImageSuffix (url, suffix = '@200w_200h_1e%7C200x200-5rc') {
    if (/content\.image\.alimmdn\.com/i.test(url) && url.indexOf(suffix) !== -1) {
      return url.substring(0, url.lastIndexOf('@'))
    }
    return url
  }
  // 如果是阿里云图，则加上后缀，否则不用处理
  static addAliImageSuffix (url, suffix = '@200w_200h_1e%7C200x200-5rc') {
    if (/content\.image\.alimmdn\.com/i.test(url) && url.indexOf(suffix) === -1) {
      url += '@200w_200h_1e%7C200x200-5rc'
    }
    return url
  }

  /*
   取meta时，要给所有的where条件加上时间限制
   */
  static genTimetopublishInterval (col = 'timetopublish') {
    // 从 [20141108, 明天) 的数据，即截止到今天
    return ` (${col} BETWEEN 20141108 AND ${Number(moment()
        .add(1, 'days')
        .format('YYYYMMDD'))}) `
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
      let match = null
      let isSku = false
      if ((match = src.match(viewAppReg))) {
        ret = match[1]
      } else if ((match = src.match(cmsDDReg))) {
        ret = match[1]
      } else if ((match = src.match(pcSiteReg))) {
        ret = match[1]
      } else if ((match = src.match(shareReg))) {
        ret = match[1] & 0xffffff
      } else if ((match = src.match(skuReg))) {
        ret = match[1] || match[2]
        isSku = true
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

module.exports = Utils
