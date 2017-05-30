const Log = require('../utils/Log')
const Utils = require('../utils/Utils')
const DB = require('../db/DB')
const path = require('path')

function run2 (file) {
  const lineReader = require('readline').createInterface({
    input: require('fs').createReadStream(
      file || path.resolve('./src/crawler/data', 'ajson.5')
    ),
    output: process.stdout,
    terminal: false
  })
  /**
 * TODO:
 * 新CMS和老CMS并行运行时，通过新CMS新建的文件，要大于老CMS最大的ID，大500就可以了
 * 防止新老CMS，一篇文章有同样的ID
 */
  lineReader.on('line', json => {
    if (!json) return
    // 这个脚本填充 article_meta 和 image表
    let article = null
    try {
      article = JSON.parse(json)
    } catch (e) {
      console.log(e)
      return
    }
    // console.log('21:', article)
    // `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增id',
    // `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '文章title',
    // `share_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '分享出去的文章的title',
    // `wx_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '分享到微信的文章的title',
    // `wb_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '分享到微博的文章的title',
    // `ctype` tinyint(1) unsigned DEFAULT 0 COMMENT '文章类型',
    // `status` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '当前文章状态: 0-新增的文章/1-已发布/2-未发布',
    // `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '文章创建时间',
    // `last_update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON update CURRENT_TIMESTAMP COMMENT '文章最后更新时间',
    // `user` varchar(60)  DEFAULT '' COMMENT '文章被那个用户所创建',
    // `lock_by` varchar(60) DEFAULT '' COMMENT '被那个用户锁定',
    // `last_update_by` varchar(60) DEFAULT '' COMMENT '最后一次更新的用户',
    // `author` varchar(60) DEFAULT '' COMMENT '文章作者姓名',
    // const batch = []
    const { node, meta } = article
    let { nid, type, title, created, changed, status, promote } = node
    if (nid >= 10500) {
      return Log.exception(`[crawler/insertMetaAndImage.js] 增量更新的文章有ID大于10500的，ID为${nid}`)
    }
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
    // firstpage === 1
    // goodthing === 2
    // zhuankan === 3
    // activity === 1
    // experience === 1
    // scene === 6 // 场景。以后可以不考虑了。也不用考虑历史问题
    // zdm === 7
    // pingce === 8
    // zhuanti === 9
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

    if (isValidArray(timetopublish)) {
      timetopublish = timetopublish[0].value || 0
    } else {
      timetopublish = 0
    }
    if (isValidArray(price)) {
      price = DB.escape(price[0].value || '')
    } else {
      price = DB.escape('')
    }

    if (isValidArray(buylink)) {
      buylink = DB.escape(buylink[0].value || '')
    } else {
      buylink = DB.escape('')
    }

    if (isValidArray(source)) {
      author = DB.escape(source[0].value || '')
    } else if (isValidArray(author)) {
      author = DB.escape(author[0].value || '')
    } else {
      author = DB.escape('')
    }

    title = DB.escape(title || '')

    if (isValidArray(titleex)) {
      titleex = DB.escape(titleex[0].value || '')
    } else {
      titleex = DB.escape('')
    }

    if (isValidArray(titlecolor)) {
      titlecolor = titlecolor[0].value
      if (!/\d+/.test(titlecolor)) {
        titlecolor = 0
      }
    } else {
      titlecolor = 0
    }
    // 增量更新
    let sql = `
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
    DB.exec(sql)
      .then(data => {
        console.log(`ID为 ${nid} 的文章入库成功 ....`)
      })
      .catch(err => {
        Log.exception(`ID为${nid}的META更新失败， SQL:${sql} 出错信息：`, err.message)
      })
    // 先删后插
    DB.exec(
      `DELETE FROM diaodiao_article_image WHERE aid = ${nid}`
    ).then(data => {
      const images = []
        .concat(setImage(1, pics))
        .concat(setImage(2, coverimage))
        .concat(setImage(4, coverex))
        .concat(setImage(8, thumb))
        .concat(setImage(16, swipeimage))
        .concat(setImage(32, banner))

      for (let image of images) {
        DB.exec(
          `
      INSERT INTO
        diaodiao_article_image
      SET
        aid=${nid},
        url=${DB.escape(image.url)},
        used=1,
        type=${image.type},
        extension_name=${DB.escape(image.extension_name)},
        size=${image.size || 0},
        width=${image.width || 0},
        height=${image.height || 0},
        alt=${DB.escape(image.alt)},
        title=${DB.escape(image.title)},
        create_time=${DB.escape(new Date(image.create_time * 1000))}
    `
        )
          .then(data => {
            console.log(`ID为 ${nid} 的image更新成功 ....`)
          })
          .catch(err => {
            console.log(err)
            Log.exception(`D为 ${nid} 的image更新成功，出错信息：`, err.message)
          })
      }
    }).catch(err => {
      console.log(err)
      Log.exception(`D为 ${nid} 的image更新失败，出错信息：`, err.message)
    })
  })
}
// run2()
// run2(path.resolve('./src/crawler/data', 'ajson.5'))
module.exports = run2

// fs.readFile('./data/ajson', 'utf8', (err, text) => {
//   if (err) {
//     console.log(err)
//     reject(err)
//   } else {
//       text.split(/\n/)
//       .forEach(json => {
//         if(!json) return;
//         // 这个脚本填充 article_meta 和 image表
//         let article = null
//         try {
//           article = JSON.parse(json)
//         } catch (e) {
//           console.log(e)
//           return
//         }
//         // console.log('21:', article)
//         // `id` int(11) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增id',
//         // `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '' COMMENT '文章title',
//         // `share_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '分享出去的文章的title',
//         // `wx_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '分享到微信的文章的title',
//         // `wb_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT '' COMMENT '分享到微博的文章的title',
//         // `ctype` tinyint(1) unsigned DEFAULT 0 COMMENT '文章类型',
//         // `status` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '当前文章状态: 0-新增的文章/1-已发布/2-未发布',
//         // `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '文章创建时间',
//         // `last_update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON update CURRENT_TIMESTAMP COMMENT '文章最后更新时间',
//         // `user` varchar(60)  DEFAULT '' COMMENT '文章被那个用户所创建',
//         // `lock_by` varchar(60) DEFAULT '' COMMENT '被那个用户锁定',
//         // `last_update_by` varchar(60) DEFAULT '' COMMENT '最后一次更新的用户',
//         // `author` varchar(60) DEFAULT '' COMMENT '文章作者姓名',
//         const batch = []
//         const {node, meta} = article
//         let {nid, type, title, created, changed, status, promote} = node
//         let {
//           timetopublish, price, buylink, source, author, titlecolor, titleex,
//           coverimage,  // cover图
//           coverex,     // coverex图
//           thumb,       // thumb图
//           swipeimage,  // 跑马灯图片
//           banner,      // banner图
//           pics         // 文章内容图
//         } = meta
//         // 关于文章ctype
//         // firstpage === 1
//         // goodthing === 2
//         // zhuankan === 3
//         // activity === 1
//         // experience === 1
//         // scene === 6 // 场景。以后可以不考虑了。也不用考虑历史问题
//         // zdm === 7
//         // pingce === 8
//         // zhuanti === 9
//         if(type === 'firstpage'){
//           if(status == 1) {
//             type = 4
//           } else {
//             type = 1
//           }
//         } else if (type === 'goodthing') {
//           if(promote == 1) {
//             type = 7
//           } else {
//             type = 2
//           }
//         } else if (type === 'zhuankan') {
//           type = 3
//         } else if (type === 'pingce') {
//           type = 8
//         } else if (type === 'zhuanti') {
//           type = 9
//         } else if (type === 'experience') {
//           type = 1
//         } else {
//           type = 0
//         }
//
//         if (isValidArray(timetopublish)) {
//           timetopublish = timetopublish[0].value || 0
//         } else {
//           timetopublish = 0
//         }
//         if (isValidArray(price)) {
//           price = DB.escape(price[0].value || '')
//         } else {
//           price = DB.escape('')
//         }
//
//         if (isValidArray(buylink)) {
//           buylink = DB.escape(buylink[0].value || '')
//         } else {
//           buylink = DB.escape('')
//         }
//
//         if(isValidArray(source)) {
//           author = DB.escape(source[0].value || '')
//         } else if(isValidArray(author)) {
//           author = DB.escape(author[0].value || '')
//         } else {
//           author = DB.escape('')
//         }
//
//         title = DB.escape(title || '')
//
//         if(isValidArray(titleex)) {
//           titleex = DB.escape(titleex[0].value || '')
//         } else {
//           titleex = DB.escape('')
//         }
//
//         if(isValidArray(titlecolor)) {
//           titlecolor = titlecolor[0].value
//           if(!/\d+/.test(titlecolor)) {
//             titlecolor = 0
//           }
//         } else {
//           titlecolor = 0
//         }
//         // console.log(`the author is ${author}`)
//         let sql = `INSERT INTO diaodiao_article_meta SET id=${nid}, title=${title}, ctype=${type}, timetopublish=${timetopublish}, buylink=${buylink}, price=${price}, titlecolor=${titlecolor}, titleex=${titleex}, create_time=${DB.escape(new Date(created * 1000))}, last_update_time=${DB.escape(new Date(changed * 1000))}, author=${author}`
//         // 目前的问题，timetopublish有将近100篇为0
//         // 所有的buylink字段为空
//         batch.push(
//           DB
//           .exec(sql)
//           .then(data => {
//             console.log(`ID为 ${nid} 的文章入库成功 ....`)
//           }).catch(err => {Log.exception(`ID为${nid}的META更新失败， SQL:${sql} 出错信息：`, err.message)})
//         )
//
//         const images = [].concat(setImage(1, pics))
//           .concat(setImage(2, coverimage))
//           .concat(setImage(4, coverex))
//           .concat(setImage(8, thumb))
//           .concat(setImage(16, swipeimage))
//           .concat(setImage(32, banner))
//
//         for (let image of images) {
//           batch.push(table.exec(`
//             INSERT INTO
//               diaodiao_article_image
//             SET
//               aid=${nid},
//               url=${DB.escape(image.url)},
//               used=1,
//               type=${image.type},
//               extension_name=${DB.escape(image.extension_name)},
//               size=${image.size || 0},
//               width=${image.width || 0},
//               height=${image.height || 0},
//               alt=${DB.escape(image.alt)},
//               title=${DB.escape(image.title)},
//               create_time=${DB.escape(new Date(image.create_time * 1000))}
//           `).then(data => {
//             console.log(`ID为 ${nid} 的image更新成功 ....`)
//           }).catch(err => {
//             console.log(err)
//             Log.exception(`D为 ${nid} 的image更新成功，出错信息：`, err.message)
//           }))
//         }
//
//         Promise.all(batch).then(() => {
//           // console.log(`ID为${nid}的文章入库成功 ....`)
//         }).catch(e => {
//             console.log(`ID为${nid}的文章入库失败 SQL:${sql} 出错信息：`, e)
//         })
//       })
//   }
// })

function isValidArray (array) {
  return Array.isArray(array) && array.length > 0
}

function setImage (type, images) {
  if (!isValidArray(images)) {
    return []
  }
  // `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT COMMENT '自增id',
  // `aid` int(11) unsigned NOT NULL COMMENT '文章的id',
  // `url` text COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片url',
  // `used` tinyint(1) unsigned NOT NULL DEFAULT 0 COMMENT '是否被使用。0-未被使用/1-被使用',
  // 第1位-内容图/第2位cover图/第3位coverex图/第4位thumb图/第5位swipe图/第6位banner图
  // `type` smallint unsigned COMMENT '图片的类型。''-未设置类型（没有被使用）
  // `origin_filename` varchar(32) DEFAULT '' COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '上传时的文件名',
  // `extension_name` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT '图片扩展名，jpg/jpeg/png/gif...',
  // `size` int unsigned NOT NULL COMMENT '图片尺寸。单位为byte',
  // `width` smallint(4) unsigned NOT NULL COMMENT '上传时的原始宽度。单位为px',
  // `height` smallint(4) unsigned NOT NULL COMMENT '上传时的原始高度。单位为px',
  // `alt` varchar(32) DEFAULT '' COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'img的alt属性',
  // `title` varchar(32) DEFAULT '' COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'img的title属性',
  // `create_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '图片上传时间',
  // /cms/sites/default/files/20150728/zk/c.jpg
  // 有些是 /cms   开头
  // 有些是 /sites 开头
  // 有些是 /files 开头
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
