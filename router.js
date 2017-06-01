'use strict'
const express = require('express')
const router = express.Router()
const SRC = './src'
const Utils = require(`${SRC}/utils/Utils`)
const Log = require(`${SRC}/utils/Log`)
const renders = require(`${SRC}/render/renders`)
const genpub = require(`${SRC}/api/genpub`) // pub页数据生成接口
const relsearch = require(`${SRC}/api/relsearch`) // 相关搜索接口
const recommend = require(`${SRC}/api/recommend`) // 推荐结果接口
const search = require(`${SRC}/api/search`) // 文章搜索。按照title搜索，按照date搜索
const Show = require(`${SRC}/api/show`) // 文章搜索。按照title搜索，按照date搜索
const show = new Show()
const ids = require(`${SRC}/api/ids`) // 拿出所有在库文章的id
const content = require(`${SRC}/api/content`) // 根据id拿出文章的content，content去除了所有html标签和markdown标识
const getMetas = require(`${SRC}/api/meta`) // meta接口
const apimode = require(`${SRC}/api/apimode`) // apimode接口
const MetaTable = require(`${SRC}/db/MetaTable`)
const metaTable = new MetaTable()
const moment = require('moment')
const cache = require('./config/cache')
// 只执行一次渲染器对象实例化，然后渲染器实例长存于内存中即可，所以应该在这儿实例化所有渲染器，而不是在路由回调中实例化
// 否则，每次路由回调执行都会实例化一个对象，可能会导致内存占用过多GC压力过大，GC压力过大，也会导致CPU占用过高
const {
  // m开头的为移动端渲染器
  mShowRender, // firstpage/goodthing/activity/expreience渲染器
  mZKRender, // 专刊页渲染器
  mZTRender, // 专题页渲染器
  mAuthorRender, // 作者页渲染器
  mTagRender, // tag页渲染器
  mBuyRender, // 购买页渲染器
  mSkuRender, // SKU渲染器
  mRssRender, // RSS聚合页
  mInviteRender, // 个人邀请页渲染器
  mJfitemRender, // 积分单品页渲染器
  mJfMallRender, // 积分商城页渲染器
  mZDMRender, // 值得买活动页渲染器
  mMetabandRender, // 值得买活动页渲染器
  mPCollectionRender, // 测评集合页渲染器

  // p开头的为pc端渲染器
  pShowRender,
  pZKRender,
  pAuthorRender,
  pTagRender // PC端渲染器
  // jkRender, // 即刻渲染接口
  // wxAppRender, // 小程序渲染接口
  // appRender, // app渲染接口
  // fbRender, // flipborad渲染接口
} = renders
const numnberReg = /^\d+$/
async function showAndZKAndZTRouter (m, id, pageType, req, res) {
  if (/show/.test(m)) {
    mShowRender
      .setPageType(pageType)
      .setId(id)
      .rende()
      .then(doc =>
        writeDoc(doc, res, pageType === 'share' ? 'showShare' : 'show')
      )
      .catch(e => happyEnd(e, res))
  } else if (/zk/.test(m)) {
    mZKRender
      .setPageType(pageType)
      .setId(id)
      .rende()
      .then(doc => writeDoc(doc, res, pageType === 'share' ? 'zkShare' : 'zk'))
      .catch(e => happyEnd(e, res))
  } else if (/zt/.test(m)) {
    mZTRender
      .setPageType(pageType)
      .setId(id)
      .rende()
      .then(doc => writeDoc(doc, res, pageType === 'share' ? 'ztShare' : 'zt'))
      .catch(e => happyEnd(e, res))
  } else {
    pageNotFound(res)
  }
}

router.get('/', async (req, res) => {
  let {
    m,
    id, // m=show OR m=relsearch OR m=recommend OR m=metaband
    src, // m=author
    tid, // m=tag
    sid, // m=sku
    aid, // m=buy
    type, // m=rss
    start, // m=TR
    end, // m=TR
    gid, // m=jfitem
    title // m=TS
  } = req.body
  // 有m说明是渲染器
  if (m && (m = m.trim().toLowerCase())) {
    // firstpage/goodthing/exprience/zk/zt
    if (/show|z(k|t)/.test(m)) {
      if (id && numnberReg.test(id)) {
        // showAndZKAndZTRouter(id, 'inapp', req, res)
        const ctype = await metaTable.getCtypeById(id)
        const trueM = Utils.ctypeToM(ctype)
        if (trueM) {
          if (m !== trueM) {
            console.log('redirect ....')
            redirect(res, `//${req.headers.host}/?m=${trueM}&id=${id}`)
          } else {
            console.log('not redirect ....')
            showAndZKAndZTRouter(m, id, 'inapp', req, res)
          }
        } else {
          console.log('pageNotFound ....')
          pageNotFound(res)
        }
      } else {
        pageNotFound(res)
      }
    } else if (/author/i.test(m)) {
      // 虽然在querystring中的汉字貌似nodejs自动decode了，但是为了保险，还是要decode
      const defaultSource = '有调机器人'
      src = decodeURIComponent(src || defaultSource)
      console.log('routers.js src is ', src)
      mAuthorRender
        .setSource(src)
        .rende()
        .then(doc => writeDoc(doc, res, 'author'))
        .catch(e => happyEnd(e, res))
      // if (src = decodeURIComponent(src)) {
      //   console.log('routers.js src ', src);
      //   mAuthorRender.setSource(src).rende().then(doc => writeDoc(doc, res, 'author')).catch(e => {
      //     Log.exception(e)
      //     res.end()
      //   })
      // } else {
      //   pageNotFound(res)
      // }
    } else if (/tag/i.test(m)) {
      if (tid && numnberReg.test(tid)) {
        if ('apimode' in req.body) {
          apimode(tid)
            .then(result => writeJSON(result, res, 'apimode'))
            .catch(e => happyEnd(e, res))
        } else {
          mTagRender
            .setTid(tid)
            .rende()
            .then(doc => writeDoc(doc, res, 'tag'))
            .catch(e => happyEnd(e, res))
        }
      } else {
        pageNotFound(res)
      }
    } else if (/buy/i.test(m)) {
      if (aid && numnberReg.test(aid)) {
        console.log('购买页路由被命中，aid为', aid)
        mBuyRender
          .setAid(aid)
          .rende()
          .then(doc => writeDoc(doc, res, 'buy'))
          .catch(e => happyEnd(e, res))
      } else {
        pageNotFound(res)
      }
    } else if (/sku/i.test(m)) {
      if (sid && numnberReg.test(sid)) {
        mSkuRender
          .setSid(sid)
          .rende()
          .then(doc => writeDoc(doc, res, 'sku'))
          .catch(e => happyEnd(e, res))
      } else {
        pageNotFound(res)
      }
    } else if (/rss/i.test(m)) {
      if (type) {
        mRssRender
          .setType(type)
          .rende()
          .then(doc => writeDoc(doc, res, 'rss'))
          .catch(e => happyEnd(e, res))
      } else {
        pageNotFound(res)
      }
    } else if (/jfitem/i.test(m)) {
      if (gid && numnberReg.test(gid)) {
        mJfitemRender
          .setPageType('inapp')
          .setGid(gid)
          .rende()
          .then(doc => writeDoc(doc, res, 'jfitem'))
          .catch(e => happyEnd(e, res))
      } else {
        pageNotFound(res)
      }
    } else if (/jfmall/i.test(m)) {
      console.log('积分商城页路由命中 ....')
      mJfMallRender
        .setPageType('inapp')
        .rende()
        .then(doc => writeDoc(doc, res, 'jfmall'))
        .catch(e => happyEnd(e, res))
    } else if (/metaband/i.test(m)) {
      console.log('文章列表条html路由命中 ....')
      if (id && numnberReg.test(id)) {
        mMetabandRender
          .setId(id)
          .rende()
          .then(doc => writeDoc(doc, res, 'metaband'))
          .catch(e => happyEnd(e, res))
      } else {
        pageNotFound(res)
      }
    } else if (/meta/i.test(m)) {
      console.log('meta接口的路由被命中：', id)
      if (id && numnberReg.test(id)) {
        getMetas(id)
          .then(meta => writeJSON(meta, res, 'meta_get'))
          .catch(e => happyEnd(e, res))
        // metaService.getRawMetas(id).then(meta => writeJSON(meta, res))
      } else {
        pageNotFound(res)
      }
    } else if (/relsearch/i.test(m)) {
      console.log('相关搜索接口的路由被命中：', id)
      if (id && numnberReg.test(id)) {
        relsearch(id)
          .then(result => writeJSON(result, res, 'relsearch'))
          .catch(e => happyEnd(e, res))
      } else {
        pageNotFound(res)
      }
    } else if (/recommend/i.test(m)) {
      console.log('推荐结果接口的路由被命中ID为', id)
      if (id && numnberReg.test(id)) {
        recommend(id)
          .then(result => writeJSON(result, res, 'recommend'))
          .catch(e => happyEnd(e, res))
      } else {
        pageNotFound(res)
      }
    } else if (/TR/i.test(m)) {
      console.log(`文章搜索按照date的接口的路由被命中，start = ${start}, end = ${end}`)
      search
        .byDate(start, end)
        .then(meta => writeJSON(meta, res, 'TR'))
        .catch(e => happyEnd(e, res))
    } else if (/TS/i.test(m)) {
      search
        .byTitle(title)
        .then(meta => writeJSON(meta, res, 'TS'))
        .catch(e => happyEnd(e, res))
    } else if (/pcollection/i.test(m)) {
      mPCollectionRender
        .rende()
        .then(doc => writeDoc(doc, res, 'pcollection'))
        .catch(e => happyEnd(e, res))
    } else {
      pageNotFound(res)
    }
  } else {
  }
})

// APP内正文页、专刊页渲染接口
router.get('/show', async (req, res) => {
  let {
    id, // ?id=
    src, // ?src=
    tid // ?tid=
  } = req.body
  if (id) {
    if (numnberReg.test(id)) {
      show
        .setType('show')
        .getData(id)
        .then(result => writeJSON(result, res, 'app_show'))
        .catch(e => happyEnd(e, res))
    } else if (id == 'pcollection') {
      console.log('pcollection 命中 ....')
      console.log(mPCollectionRender)
      mPCollectionRender
        .getRendeData()
        .then(result => writeJSON(result, res, 'pcollection'))
        .catch(e => happyEnd(e, res))
    }
  } else if (src && src.trim()) {
    show
      .setType('author')
      .getData(src)
      .then(result => writeJSON(result, res, 'app_show'))
      .catch(e => happyEnd(e, res))
  } else if (tid && numnberReg.test(tid)) {
    show
      .setType('tag')
      .getData(tid)
      .then(result => writeJSON(result, res, 'app_show'))
      .catch(e => happyEnd(e, res))
  } else {
    pageNotFound(res)
  }
})

// 拿出所有在库文章的id，可以按照指定条件排序
router.get('/ids', async (req, res) => {
  console.log('命中ids接口 。。。')
  ids(req.body.orderby)
    .then(result => writeJSON(result, res, 'ids'))
    .catch(e => happyEnd(e, res))
})

// 拿出所有在库文章的content，可以按照指定条件排序
router.get('/content', async (req, res) => {
  console.log('命中GET content接口 。。。')
  let { id } = req.body
  if (id && numnberReg.test(id)) {
    console.log('id is:', id)
    content(id)
      .then(result => writeJSON(result, res))
      .catch(e => happyEnd(e, res))
  } else {
    writeJSON(null, res)
  }
})

// 拿出所有在库文章的content，可以按照指定条件排序
router.post('/content', async (req, res) => {
  try {
    let { ids } = req.body
    if (Utils.isValidArray(ids)) {
      content(ids)
        .then(result => writeJSON(result, res))
        .catch(e => happyEnd(e, res))
    } else {
      writeJSON(null, res)
    }
  } catch (e) {
    happyEnd(e, res)
  }
})

// const showReg = /\/show\/(\d+)/
// router.get(showReg, async(req, res) => {
//   let match = req.originalUrl.match(showReg)
//   let id = Utils.toShortId(match[1])
//   console.log('APP内渲染接口被命中 ....', id)
//   if (id && numnberReg.test(id)) {
//     show.setType('show').getData(id).then(result => writeJSON(result, res, 'app_show')).catch(e => happyEnd(e, res))
//     // show(id).then()
//   } else {
//     pageNotFound(res)
//   }
// })

// const authorReg = /\/show\/\?src=(.+)/
// router.get(authorReg, async(req, res) => {
//   let match = req.originalUrl.match(authorReg)
//   let src = match[1]
//   if (src && src.trim()) {
//     show.setType('author').getData(src).then(result => writeJSON(result, res, 'app_show')).catch(e => happyEnd(e, res))
//     // show(id).then()
//   } else {
//     pageNotFound(res)
//   }
// })

// const tagReg = /\/show\/\?tid=(\d+)/
// router.get(tagReg, async(req, res) => {
//   let match = req.originalUrl.match(tagReg)
//   let tid = match[1]
//   if (tid && numnberReg.test(tid)) {
//     show.setType('tag').getData(tid).then(result => writeJSON(result, res, 'app_show')).catch(e => happyEnd(e, res))
//     // show(id).then()
//   } else {
//     pageNotFound(res)
//   }
// })

// m=show OR m=zk OR m=zt的share页
const longidReg = /\/share\/(\d+)\.html/
router.get(longidReg, async (req, res) => {
  let match = req.originalUrl.match(longidReg)
  let id = Utils.toShortId(match[1])
  console.log('share页路由被命中 ....', id)
  if (id && numnberReg.test(id)) {
    const trueM = Utils.ctypeToM(await metaTable.getCtypeById(id))
    showAndZKAndZTRouter(trueM, id, 'share', req, res)
  } else {
    pageNotFound(res)
  }
})

const inappZdmReg = /\/zdmactivity\/(\d+)_?(\d+)?\.html/
router.get(inappZdmReg, (req, res) => {
  let match = req.originalUrl.match(inappZdmReg)
  let activityCid = match[1]
  let goodsCid = match[2]
  console.log(
    `app内的值得买活动路由被激活,activityCid:${activityCid}, goods_cid:${goodsCid}`
  )
  mZDMRender
    .setData(activityCid, goodsCid)
    .setPageType('inapp')
    .rende()
    .then(doc => writeDoc(doc, res, 'zdmactivity'))
    .catch(e => happyEnd(e, res))
})

const shareZdmReg = /\/zdmshare\/(\d+)_?(\d+)?\.html/
router.get(shareZdmReg, (req, res) => {
  let match = req.originalUrl.match(shareZdmReg)
  let activityCid = match[1]
  let goodsCid = match[2]
  console.log(
    `值得买活动share页路由被激活,activityCid:${activityCid}, goodsCid:${goodsCid}`
  )
  mZDMRender
    .setData(activityCid, goodsCid)
    .setPageType('share')
    .rende()
    .then(doc => writeDoc(doc, res, 'zdmshare'))
    .catch(e => happyEnd(e, res))
})

router.get(/\/mall\.html/, (req, res) => {
  mJfMallRender
    .setPageType('share')
    .rende()
    .then(doc => writeDoc(doc, res, 'jfmallShare'))
    .catch(e => happyEnd(e, res))
})

const gidReg = /\/jfitem\/(\d+)\.html/
router.get(gidReg, (req, res) => {
  let match = req.originalUrl.match(gidReg)
  let gid = match[1]
  mJfitemRender
    .setPageType('share')
    .setGid(gid)
    .rende()
    .then(doc => writeDoc(doc, res, 'jfitem'))
    .catch(e => happyEnd(e, res))
})

const uidReg = /\/invite\/(\d+)\.html/
router.get(uidReg, (req, res) => {
  let match = req.originalUrl.match(uidReg)
  let uid = match[1]
  mInviteRender
    .setUid(uid)
    .rende()
    .then(doc => writeDoc(doc, res, 'invite'))
    .catch(e => happyEnd(e, res))
})

const pcShowReg = /\/article\/(\d+)\.html/
router.get(pcShowReg, async (req, res) => {
  console.log(`PC article 路由被激活，此文章url为${req.originalUrl} ...`)
  let match = req.originalUrl.match(pcShowReg)
  let id = match[1]
  // 需要判断这篇文章是专刊还是article还是专刊
  const ctype = await metaTable.getCtypeById(id)
  if (ctype) {
    // 好物/首页/经验/活动
    // if(ctype === 1 || ctype === 2 || ctype === 4 || ctype === 5) {
    if (/^1|2|4|5$/.test(ctype)) {
      pShowRender
        .setId(id)
        .rende()
        .then(doc => writeDoc(doc, res, 'article'))
        .catch(e => happyEnd(e, res))
    } else if (ctype === 3) {
      // 专刊
      pZKRender
        .setId(id)
        .rende()
        .then(doc => writeDoc(doc, res, 'pc_zk'))
        .catch(e => happyEnd(e, res))
    } else {
      pageNotFound(res)
    }
  } else {
    pageNotFound(res)
  }
})

const mSkuReg = /\/sku\/(?:\d+\/)?(\d+)\.html/
router.get(mSkuReg, (req, res) => {
  let match = req.originalUrl.match(mSkuReg)
  let sid = match[1]
  mSkuRender
    .setSid(sid)
    .rende()
    .then(doc => writeDoc(doc, res, 'sku'))
    .catch(e => happyEnd(e, res))
})

const pcEditorReg = /\/editor\/(.+)\.html/
router.get(pcEditorReg, (req, res) => {
  let match = req.originalUrl.match(pcEditorReg)
  /**
   * 对于 /editor/土豆泥.html，若不decode src，则为 %E5%9C%9F%E8%B1%86%E6%B3%A5
   * 但是很奇怪，对于/?m=author&src=土豆泥，虽然浏览器也encode了，但是没有decode也没问题
   */
  let src = decodeURIComponent(match[1])
  pAuthorRender
    .setSource(src)
    .rende()
    .then(doc => writeDoc(doc, res, 'editor'))
    .catch(e => happyEnd(e, res))
})

const pcCategoryReg = /\/category\/(\d+)\.html/
router.get(pcCategoryReg, (req, res) => {
  let match = req.originalUrl.match(pcCategoryReg)
  let tid = match[1]
  console.log(tid)
  pTagRender
    .setTid(tid)
    .rende()
    .then(doc => writeDoc(doc, res, 'category'))
    .catch(e => happyEnd(e, res))
})

router.post('/', async (req, res) => {
  // console.log(req.body);
  let { query } = req
  let { m } = query
  let postData = req.body
  console.log('postData:', postData)
  // 有m说明是渲染器
  if (m && (m = m.trim())) {
    console.log('m：', m)
    if (/genpub/i.test(m)) {
      console.log('命中genpub接口 ....')
      genpub(postData)
        .then(data => writeJSON(data, res, 'genpub'))
        .catch(e => happyEnd(e, res))
    } else if (/meta/i.test(m)) {
      console.log('命中meta POST接口 ...., postData为：', postData)
      let cids = postData.cids
      if (Utils.isValidArray(cids)) {
        getMetas(cids)
          .then(meta => writeJSON(meta, res, 'meta_post'))
          .catch(e => {
            Log.exception(e)
            res.end()
          })
      } else {
        // TODO:返回参数错误信息
      }
      // metaService.getRawMetas(postData).then(meta => writeJSON(meta, res))
    } else if (/TR/i.test(m)) {
      // console.log(`文章搜索按照date的接口的路由被命中，start = ${start}, end = ${end}` )
      let start = null
      let end = null
      if (postData) {
        start = postData.start
        end = postData.end
      }
      search
        .byDate(start, end)
        .then(meta => writeJSON(meta, res, 'TR'))
        .catch(e => happyEnd(e, res))
    } else if (/TS/i.test(m)) {
      // console.log('命中TS POST接口 ....')
      // console.log(postData)
      // res.json('noting')

      search
        .byTitle(postData)
        .then(meta => writeJSON(meta, res, 'TS'))
        .catch(e => happyEnd(e, res))
    }
  }
})

// 幸福和快乐是结局 ...
function happyEnd (e, res) {
  // 打印异常log
  Log.exception(e)
  // 直接结束。防止一直没有返回，导致客户端请求一致是pending状态
  res.end()
}

function redirect (res, Location) {
  res.writeHead(302, {
    Location
  })
  res.end()
}

function pageNotFound (res) {
  res.writeHead(404)
  res.end('无此页面 ...')
}
/**
 * header('Cache-Control:max-age=' . $max_age);
   header("Date: ".gmdate("D, d M Y H:i:s", time())." GMT");
   header("Last-Modified: ".gmdate("D, d M Y H:i:s", time())." GMT");
   header("Expires: ".gmdate("D, d M Y H:i:s", time() + $max_age)." GMT");

   Cache-Control:max-age=86400
   Date:Thu, 11 May 2017 06:09:43 GMT
   Last-Modified:Thu, 11 May 2017 06:09:43 GMT
   Expires:Fri, 12 May 2017 06:09:43 GMT

   GMT的小时数 + 8 = UTC时间
   8是我们的时区
 */
function addCacheControlHeader (res, type) {
  if (!type) return
  // 从配置中拿到这个路由的缓存配置
  const cacheOfType = cache[type]
  let maxAge = -1
  if (cacheOfType) {
    maxAge = cacheOfType.maxAge
  }
  if (maxAge === -1) return
  const GMT = 'GMT'
  const pattern = 'ddd, D MMM YYYY HH:mm:ss'
  // 获得北京时区的UTC时间
  const now = moment().utcOffset(0)
  const date = now.format(pattern)
  // maxAge的单位是秒（s），所以，expires应该加上maxAge秒
  const expires = now.add(maxAge, 's').format(pattern)
  res.append('Cache-Control', `max-age=${maxAge}`)
  res.append('Date', `${date} ${GMT}`)
  res.append('Last-Modified', `${date} ${GMT}`)
  res.append('Expires', expires)
}

function writeDoc (doc, res, type) {
  if (!doc) res.end()
  addCacheControlHeader(res, type)
  res.writeHead(200, {
    'Content-Type': 'text/html'
  })
  res.write(doc)
  res.end()
}

function writeJSON (json, res, type) {
  if (!json) res.end()
  addCacheControlHeader(res, type)
  res.json(json)
  res.end()
}
// router.all(/(\w+)/i, requestHandler)
module.exports = router

// 启动渲染器路由
// const renderRouter = new RenderRouter
// 所有渲染器的父类
// const render = new Render
// router.get('/', (req, res) => {
//     console.log(`${req.originalUrl}`)
//     res.end(`hello ${req.originalUrl}`)
//     // m=show&id=1
//     // m=zk&id=1
//     // m=zt&id=1
//     // m=author&src=ZRJ
//     const {m, id, src, tid} = req.body
//     // 如果m有值的话，说明渲染的是移动页
//     if (m) {
//       // firstpage/goodthing/exprience
//       if (/show/i.test(m)){
//
//       }
//       // 专刊
//       else if (/zk/i.test(m))
//       {
//
//       }
//       // 专题
//        else if (/zt/i.test(m))
//       {
//
//       }
//       // 作者
//       else if (/author/i.test(m))
//       {
//
//       }
//       // tag
//       else if (/tag/i.test(m))
//       {
//
//       }
//     } else {
//
//     }

// const {m, id, src} = req.body
// if(m){
//   if(/show|zk|zt/i.test(m)){
//
//   } else if (/author/i.test(m)) {
//
//   } else if (/tag/i.test(m)){
//
//   }
// } else {
//
// }
// render
//   .set(m, id, src)
//   .getData()
//   .then(data => {
//     try {
//       // 如果
//       let mtype = Utils.ctypeToM(data.meta.ctype)
//       // 如果过来的url形如：m=zk&id=1，但确是show的模板，则重定向为 m=show&id=1
//       if (mtype == m) {
//         res.writeHead(200, {'Content-Type': 'text/html'})
//         const doc = renderRouter.setRenderType(m).getRender().setData(data).rende()
//         res.write(doc)
//       } else {
//         if(id) {
//           res.writeHead(302, {'Location': `//${req.headers.host}/?m=${mtype}&id=${id}`})
//         } else if (src) {
//           res.writeHead(302, {'Location': `//${req.headers.host}/?m=${mtype}&src=${id}`})
//         }
//       }
//     } catch (e) {
//       console.log(e)
//       runLogger.error(e)
//     } finally {
//       res.end()
//     }
// }).catch(e => {
//   console.log(e)
//   // 若发生错误，则跳转到一个特定的模板
//   runLogger.error(e)
// })
// })
