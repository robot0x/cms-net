// const Table = require('../db/Table')
// const table = new Table('article_meta', ['aid', 'content'])
// const fs = require('fs')
const Log = require('../utils/Log')
// const Promise = require('bluebird')
const DB = require('../db/DB')

class Writer {
  write (content) {
    // const { markdown, meta, images } = content
    const { markdown, meta } = content
    const { id } = meta
    // const batch = []
    // batch.push(
    DB.exec(
      `INSERT INTO diaodiao_article_content set aid=${id}, content=${DB.escape(markdown)}`
    ).then(() => {
      console.log(`ID为${id}的文章入库成功 ....`)
    }).catch(err => {
      console.log(err)
      Log.exception(`id为${id}的文章写入article_content数据库出错，出错信息：`, err.message)
    })
    // )
    // batch.push(table.exec(`INSERT INTO diaodiao_article_meta set id=${id}, title=${db.escape(meta.title)}, ctype=${meta.ctype}, status=1, author=${db.escape(meta.author)}`).catch(err => {
    //   console.log(err)
    //   Log.exception(`id为${id}的文章写入article_meta数据库出错，出错信息：`, err.message)
    // }))
    // for (let image of images) {
    //   batch.push(table.exec(`INSERT INTO diaodiao_article_image set aid=${id}, url=${db.escape(image.url)}, used=1, type=${image.type}, extension_name=${db.escape(image.extension_name)}, width=${image.width}, height=${image.height}`).catch(err => {
    //     console.log(err)
    //     Log.exception(`id为${id}的文章写入image数据库出错，出错信息：`, err.message)
    //   }))
    // }

    // Promise.all(batch)
    //   .then(() => {
    //     console.log(`ID为${id}的文章入库成功 ....`)
    //   })
    //   .catch(e => {
    //     console.log(`ID为${id}的文章入库失败 .... 信息：`, e)
    //   })
  }
}

module.exports = Writer
