const path = require('path')
const fs = require('fs')
const Promise = require('bluebird')
/**
 * 段落与段落之间 用 \n\n 隔开，若一个 \n 则还是在一个p标签里
 *  1. goodthing (type = show)                                http://c.diaox2.com/view/app/?m=show&id=9669
 *  2. firstpage (type = show)                                http://c.diaox2.com/view/app/?m=show&id=5344
 *  3. experience (type = show)                               http://c.diaox2.com/view/app/?m=show&id=1022
 *  4. zhuankan (type = zhuankan) 文章集合                     http://c.diaox2.com/view/app/?m=zk&id=3053
 *  5. zhuanti (type = zhuanti from 7017) 文章集合             http://c.diaox2.com/view/app/?m=zt&id=7080
 *  6. scene (type = scene)线上原来出现过，但是现在没用过了      http://c.diaox2.com/view/app/?m=scene&id=3045
 *    场景页不用考虑，我们以后不用了，并且新老用户都看不到  李园宁 2017-4-19
 *
 *  ctype 用来区分不同的渲染器
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
class Reader {
  constructor (file = 'ajson.5') {
    // console.log(path.resolve('./src/crawler/data', file))
    this.file = path.resolve('./src/crawler/data', file)
  }
  read (file = this.file) {
    // console.log('开始读取文件，读取的文件为：', file)
    // console.log('开始读取nidlist文件 ....')
    return new Promise((resolve, reject) => {
      fs.readFile(file, 'utf8', (err, text) => {
        if (err) {
          console.log(err)
          reject(err)
        } else {
          resolve(
            text
              .split(/\n/)
              // .filter(content => /goodthing|firstpage|experience|zhuankan|zhuanti/.test(content))
              // .filter(content => /zhuankan|zhuanti/.test(content))
              .map(content => {
                if (!content) return
                let article = null
                try {
                  article = JSON.parse(content)
                } catch (e) {
                  console.log(e)
                  return
                }
                const { node } = article
                let { type } = node
                let id = Number(node.nid)
                // let [id, type] = content.split(/\s+/)
                const item = { id, m: 'show', type }
                switch (type) {
                  case 'zhuankan':
                    item.m = 'zk'
                    break
                  case 'zhuanti':
                    item.m = 'zt'
                    break
                }
                item.url = `http://z.diaox2.com/view/app/?m=${item.m}&id=${id}`
                // console.log(item)
                return item
              })
              .sort((c1, c2) => c2.id - c1.id)
          )
        }
      })
    })
  }
}

// const reader = new Reader()
// reader.read().then(contents => console.log(contents))

module.exports = Reader
