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
//   let { nid, type, title, created, changed, status, promote } = node
  let { nid } = node
  if (nid >= 10500) {
    return Log.exception(
      `[crawler/insertMetaAndImage.js] 增量更新的文章有ID大于10500的，ID为${nid}`
    )
  }
  let {
    coverimage, // cover图
    coverex, // coverex图
    thumb, // thumb图
    swipeimage, // 跑马灯图片
    banner, // banner图
    pics // 文章内容图
  } = meta
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
    // let [deleteImageResult, insertMetaResult] = await Promise.all([DB.exec(deleteImageSQL), DB.exec(insertMetaSQL)])
    let [deleteImageResult] = await Promise.all([DB.exec(deleteImageSQL)])
    console.log(`[STEP4] ID为 ${nid} 删除图片成功，删除了${deleteImageResult.affectedRows}条 ...`)
    // console.log(`[STEP5] ID为 ${nid} 插入meta表成功，影响${insertMetaResult.affectedRows}行 ...`)
    let insertImageResult = await DB.exec(insertImageSQL)
    console.log(`[STEP6] ID为 ${nid} 插入图片成功，插入了${insertImageResult.affectedRows}条 ...`)
  } catch (error) {
    console.log(`ID为 ${nid} 的文章插入图片和meta失败：`, error)
    Log.exception(error)
  }
  // console.log(`ID为 ${nid} 的文章插入图片和meta成功 ....`)
  // process.exit(0)
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
