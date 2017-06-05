const Log = require('../utils/Log')
const Utils = require('../utils/Utils')
const DB = require('../db/DB')
const fs = require('fs')
let Promise = require('bluebird')
async function run2 (file) {
  let json = await Promise.promisify(fs.readFile)(file, 'utf8')
  // console.log(json)
  if (!json) return
  // 这个脚本填充 article_meta 和 image表
  let article = null
  try {
    article = JSON.parse(json)
  } catch (e) {
    console.log(e)
    return
  }
  const { node, meta } = article
  let { nid, type, title, created, changed, status, promote } = node
  if (nid >= 10500) {
    return Log.exception(
      `[crawler/insertMetaAndImage.js] 增量更新的文章有ID大于10500的，ID为${nid}`
    )
  }
  console.log(title)
  let {
    timetopublish,
    price,
    buylink,
    source,
    author,
    titlecolor,
    titleex,
    coverimage, // cover图
    coverex, // coverex图
    thumb, // thumb图
    swipeimage, // 跑马灯图片
    banner, // banner图
    pics // 文章内容图
  } = meta
  // 关于文章ctype
  if (type === 'firstpage') {
    if (status == 1) {
      type = 4
    } else {
      type = 1
    }
  } else if (type === 'goodthing') {
    if (promote == 1) {
      type = 7
    } else {
      type = 2
    }
  } else if (type === 'zhuankan') {
    type = 3
  } else if (type === 'pingce') {
    type = 8
  } else if (type === 'zhuanti') {
    type = 9
  } else if (type === 'experience') {
    // 线上的 ctype = 5 的是coupon，但是从来没有用过，所以，可以用5来表示经验
    // 原来想的是，经验的渲染模板跟firstpage/goodthing一样，所以ctype都归为1，即和firstpage一致
    // 这样做是不好的，因为会把以前的类型信息给丢掉，若以前的页面要用经验这种类型的文章，上新CMS之后，就拿不到了
    // type = 1
    type = 5
  } else {
    type = 0
  }

  if (Utils.isValidArray(timetopublish)) {
    timetopublish = timetopublish[0].value || 0
  } else {
    timetopublish = 0
  }
  if (Utils.isValidArray(price)) {
    price = DB.escape(price[0].value || '')
  } else {
    price = DB.escape('')
  }

  if (Utils.isValidArray(buylink)) {
    buylink = DB.escape(buylink[0].value || '')
  } else {
    buylink = DB.escape('')
  }

  if (Utils.isValidArray(source)) {
    author = DB.escape(source[0].value || '')
  } else if (Utils.isValidArray(author)) {
    author = DB.escape(author[0].value || '')
  } else {
    author = DB.escape('')
  }

  title = DB.escape(title || '')

  if (Utils.isValidArray(titleex)) {
    titleex = DB.escape(titleex[0].value || '')
  } else {
    titleex = DB.escape('')
  }

  if (Utils.isValidArray(titlecolor)) {
    titlecolor = titlecolor[0].value
    if (!/\d+/.test(titlecolor)) {
      titlecolor = 0
    }
  } else {
    titlecolor = 0
  }
  // 增量更新
  let insertMetaSQL = `
  INSERT INTO
    diaodiao_article_meta
  SET
    id=${nid},
    title=${title},
    ctype=${type},
    timetopublish=${timetopublish},
    buylink=${buylink},
    price=${price},
    titlecolor=${titlecolor},
    titleex=${titleex},
    create_time=${DB.escape(new Date(created * 1000))},
    last_update_time=${DB.escape(new Date(changed * 1000))},
    author=${author}
  ON DUPLICATE KEY
  UPDATE
    title=${title},
    ctype=${type},
    timetopublish=${timetopublish},
    buylink=${buylink},
    price=${price},
    titlecolor=${titlecolor},
    titleex=${titleex},
    create_time=${DB.escape(new Date(created * 1000))},
    last_update_time=${DB.escape(new Date(changed * 1000))},
    author=${author}
  `
  let deleteImageSQL = `DELETE FROM diaodiao_article_image WHERE aid = ${nid}`
  const images = []
    .concat(setImage(1, pics))
    .concat(setImage(2, coverimage))
    .concat(setImage(4, coverex))
    .concat(setImage(8, thumb))
    .concat(setImage(16, swipeimage))
    .concat(setImage(32, banner))
  let insertImageSQL = `
       INSERT INTO diaodiao_article_image
        (aid, url, used, type,extension_name,size,width,height)
       VALUES`
  let values = []
  for (let image of images) {
    values.push(
      `(${nid},${DB.escape(image.url)},1,${image.type},${DB.escape(image.extension_name)},${image.size || 0},${image.width || 0},${image.height || 0})`
    )
  }
  insertImageSQL = insertImageSQL + values.join(',')
  try {
    await Promise.all([DB.exec(deleteImageSQL), DB.exec(insertMetaSQL)])
    await DB.exec(insertImageSQL)
  } catch (error) {
    console.log(`ID为${nid}的文章入库失败 出错信息：`, error)
  }
  console.log(`ID为${nid}的文章入库成功 ....`)
  run2 = null
}

function setImage (type, images) {
  if (!Utils.isValidArray(images)) {
    return []
  }
  return images.map(image => {
    const {
      filename,
      relaURL,
      alt,
      title,
      width,
      height,
      filesize,
      timestamp
    } = image
    return {
      url: 'content.image.alimmdn.com' + relaURL,
      used: 1,
      type,
      origin_filename: filename,
      extension_name: Utils.getFileExtension(relaURL),
      size: filesize,
      width,
      height,
      alt,
      title,
      create_time: timestamp
    }
  })
}
module.exports = run2
