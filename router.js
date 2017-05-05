'use strict'
const express = require('express')
const router = express.Router()
const SRC = './src'
const Utils = require(`${SRC}/utils/Utils`)
const renders = require(`${SRC}/render/renders`)
const genpub = require(`${SRC}/api/genpub`) // pub页数据生成接口
const relsearch = require(`${SRC}/api/relsearch`) // 相关搜索接口
const recommend = require(`${SRC}/api/recommend`) // 推荐结果接口
const search = require(`${SRC}/api/search`) // 文章搜索。按照title搜索，按照date搜索
const show = require(`${SRC}/api/show`) // 文章搜索。按照title搜索，按照date搜索
const MetaTable = require(`${SRC}/db/MetaTable`)
const metaTable = new MetaTable
const {
  mShowRender, mZKRender, mZTRender, mAuthorRender, mTagRender, // 移动端渲染器
  mBuyRender, mSkuRender,
  mRssRender, //RSS聚合页
  mInviteRender, // 个人邀请页
  mJfitemRender, // 积分单品页
  mJfMallRender, // 积分商城页
  mZDMRender, // 值得买活动页
  mMetabandRender, // 值得买活动页

  pShowRender, pZKRender, pAuthorRender, pTagRender,  // PC端渲染器

  jkRender, // 即刻渲染接口
  wxAppRender, // 小程序渲染接口
  appRender, // app渲染接口
  fbRender, // flipborad渲染接口

} = renders

async function showAndZKAndZTRouter (m, id, pageType, req, res) {
  if (/show/.test(m)) {
    mShowRender.setPageType(pageType).setId(id).rende().then(doc => writeDoc(doc, res))
  } else if (/zk/.test(m)) {
    mZKRender.setPageType(pageType).setId(id).rende().then(doc => writeDoc(doc, res))
  } else if (/zt/.test(m)) {
    mZTRender.setPageType(pageType).setId(id).rende().then(doc => writeDoc(doc, res))
  } else {
    pageNotFound(res)
  }
}

// 只执行一次，所以应该在这儿实例化所有渲染器，而不是在路由回调中实例化
// 否则，每次路由回调执行都会实例化一个对象，可能会导致内存占用过多GC压力过大
router.get('/', async (req, res) => {
  let {
    m,
    id, // m=show OR m=relsearch OR m=recommend OR m=metaband
    src, // m=author
    tid, // m=tag
    sid, // m=sku
    aid,  // m=buy
    type, // m=rss
    start, // m=TR
    end, // m=TR
    gid // m=jfitem
  } = req.body
  // 有m说明是渲染器
  if (m && (m = m.trim().toLowerCase())) {
    // firstpage/goodthing/exprience/zk/zt
    if (/show|z(k|t)/.test(m)) {
      if (id && /\d+/.test(id)) {
        // showAndZKAndZTRouter(id, 'inapp', req, res)
        const trueM = Utils.ctypeToM(await metaTable.getCtypeById(id))
        if( trueM ) {
          if( m !== trueM ) {
            redirect(res, `//${req.headers.host}/?m=${trueM}&id=${id}`)
          } else {
            showAndZKAndZTRouter(m, id, 'inapp', req, res)
            // if (/show/.test(m)) {
            //   mShowRender.setPageType('inapp').setId(id).rende().then(doc => writeDoc(doc, res))
            // } else if (/zk/.test(m)) {
            //   mZKRender.setPageType('inapp').setId(id).rende().then(doc => writeDoc(doc, res))
            // } else if (/zt/.test(m)) {
            //   mZTRender.setPageType('inapp').setId(id).rende().then(doc => writeDoc(doc, res))
            // } else {
            //   pageNotFound(res)
            // }
          }
        } else {
          pageNotFound(res)
        }
      } else {
        pageNotFound(res)
      }
    } else if (/author/i.test(m)) {
      if (src) {
        mAuthorRender.setSource(src).rende().then(doc => writeDoc(doc, res))
      } else {
        pageNotFound(res)
      }
    } else if (/tag/i.test(m)) {
      if(tid && /\d+/.test(tid)){
        mTagRender.setTid(tid).rende().then(doc => writeDoc(doc, res))
      } else {
        pageNotFound(res)
      }
    } else if (/buy/i.test(m)) {
      if(aid && /\d+/.test(aid)){
        mBuyRender.setAid(aid).rende().then(doc => writeDoc(doc, res))
      } else {
        pageNotFound(res)
      }
    } else if (/sku/i.test(m)) {
      if(sid && /\d+/.test(sid)) {
        mSkuRender.setSid(sid).rende().then(doc => writeDoc(doc, res))
      } else {
        pageNotFound(res)
      }
    } else if (/rss/i.test(m)) {
      if(type) {
        mRssRender.setType(type).rende().then(doc => writeDoc(doc, res))
      } else {
        pageNotFound(res)
      }
    } else if (/jfitem/i.test(m)) {
      if(gid && /\d+/.test(gid)) {
        mJfitemRender.setGid(gid).rende().then(doc => writeDoc(doc, res))
      } else {
        pageNotFound(res)
      }
    } else if (/jfmall/i.test(m)) {
        console.log('积分商城页路由命中 ....')
        mJfMallRender.rende().then(doc => writeDoc(doc, res))
    } else if (/metaband/i.test(m)) {
        console.log('文章列表条html路由命中 ....')
        if(id && /\d+/.test(id)){
          mMetabandRender.setId(id).rende().then(doc => writeDoc(doc, res))
        } else {
          pageNotFound(res)
        }
    } else if (/meta/i.test(m)) {
      console.log('meta接口的路由被命中：', id)
      if(id && /\d+/.test(id)){
        metaService.getRawMetas(id).then(meta => writeJSON(meta, res))
      } else {
        pageNotFound(res)
      }
    } else if (/relsearch/i.test(m)) {
      console.log('相关搜索接口的路由被命中：', id)
      if(id && /\d+/.test(id)){
        relsearch(id).then(result => writeJSON(result, res))
      } else {
        pageNotFound(res)
      }
    } else if (/recommend/i.test(m)) {
      console.log('推荐结果接口的路由被命中ID为', id)
      if(id && /\d+/.test(id)){
        recommend(id).then(result => writeJSON(result, res))
      } else {
        pageNotFound(res)
      }
    } else if (/TR/i.test(m)) {
      console.log('文章搜索按照date的接口的路由被命中ID为', id)
      search.byDate(start, end).then(meta => writeJSON(meta, res))
    } else {
      pageNotFound(res)
    }
  } else {

  }
})

// APP内正文页、专刊页渲染接口
const showReg = /\/show\/(\d+)/
router.get(showReg, async (req, res) => {
  let match = req.originalUrl.match(showReg)
  let id = Utils.toShortId(match[1])
  console.log('APP内渲染接口被命中 ....', id)
  if (id && /\d+/.test(id)) {
    show(id).then(result => writeJSON(result, res))
  } else {
    pageNotFound(res)
  }
})

// m=show OR m=zk OR m=zt的share页
const longidReg = /\/share\/(\d+)\.html/
router.get(longidReg, async (req, res) => {
  let match = req.originalUrl.match(longidReg)
  let id = Utils.toShortId(match[1])
  console.log('share页路由被命中 ....', id);
  if (id && /\d+/.test(id)) {
    const trueM = Utils.ctypeToM(await metaTable.getCtypeById(id))
    showAndZKAndZTRouter(trueM, id, 'share', req, res)
  } else {
    pageNotFound(res)
  }
})


const inapp_zdmReg = /\/zdmactivity\/(\d+)_?(\d+)?\.html/
router.get(inapp_zdmReg, (req, res) => {
  let match = req.originalUrl.match(inapp_zdmReg)
  let activity_cid = match[1]
  let goods_cid = match[2]
  console.log(`app内的值得买活动路由被激活,activity_cid:${activity_cid}, goods_cid:${goods_cid}`)
  mZDMRender.setData(activity_cid, goods_cid).setPageType('inapp').rende().then(doc => writeDoc(doc, res))
})

const share_zdmReg = /\/zdmshare\/(\d+)_?(\d+)?\.html/
router.get(share_zdmReg, (req, res) => {
  let match = req.originalUrl.match(share_zdmReg)
  let activity_cid = match[1]
  let goods_cid = match[2]
  console.log(`值得买活动share页路由被激活,activity_cid:${activity_cid}, goods_cid:${goods_cid}`)
  mZDMRender.setData(activity_cid, goods_cid).setPageType('share').rende().then(doc => writeDoc(doc, res))
})

router.get(/\/mall\.html/, (req, res) => {
  mJfMallRender.setPageType('share').rende().then(doc => writeDoc(doc, res))
})



const gidReg = /\/jfitem\/(\d+)\.html/
router.get(gidReg, (req, res) => {
  let match = req.originalUrl.match(gidReg)
  let gid = match[1]
  mJfitemRender.setPageType('share').setGid(gid).rende().then(doc => writeDoc(doc, res))
})

const uidReg = /\/invite\/(\d+)\.html/
router.get(uidReg, (req, res) => {
  let match = req.originalUrl.match(uidReg)
  let uid = match[1]
  mInviteRender.setUid(uid).rende().then(doc => writeDoc(doc, res))
})

const pcShowReg = /\/article\/(\d+)\.html/
router.get(pcShowReg, async (req, res) => {
  console.log(`PC article 路由被激活，此文章url为${req.originalUrl} ...`);
  console.log(req.originalUrl.match(pcShowReg))
  let match = req.originalUrl.match(pcShowReg)
  let id = match[1]
  // 需要判断这篇文章是专刊还是article还是专刊
  const ctype = await metaTable.getCtypeById(id)
  if(ctype) {
    // 好物/首页/经验/活动
    // if(ctype === 1 || ctype === 2 || ctype === 4 || ctype === 5) {
    if(/^1|2|4|5$/.test(ctype)) {
      pShowRender.setId(id).rende().then(doc => writeDoc(doc, res))
    } else if (ctype === 3){ // 专刊
      pZKRender.setId(id).rende().then(doc => writeDoc(doc, res))
    } else {
      pageNotFound(res)
    }
  } else {
    pageNotFound(res)
  }
})

const mSkuReg = /\/sku\/(\d+)\.html/
router.get(mSkuReg, (req, res) => {
  let match = req.originalUrl.match(mSkuReg)
  let sid = match[1]
  mSkuRender.setSid(sid).rende().then(doc => writeDoc(doc, res))
})

const pcEditorReg = /\/editor\/(.+)\.html/
router.get(pcEditorReg, (req, res) => {
  let match = req.originalUrl.match(pcEditorReg)
  let src = match[1]
  console.log(src)
  pAuthorRender.setSource(src).rende().then(doc => writeDoc(doc, res))
})

const pcCategoryReg = /\/category\/(\d+)\.html/
router.get(pcCategoryReg, (req, res) => {
  let match = req.originalUrl.match(pcCategoryReg)
  let tid = match[1]
  console.log(tid)
  pTagRender.setTid(tid).rende().then(doc => writeDoc(doc, res))
})


router.post('/', async (req, res) => {
  console.log('post/ 执行 ...');
  // console.log(req.body);
  console.log(req.query)
  let { query } = req
  let { m } = query
  let postData = req.body
  // 有m说明是渲染器
  if(m && (m = m.trim().toLowerCase())){
    if (/genpub/i.test(m)) {
      console.log('命中genpub接口 ....')
      genpub(postData).then(data => writeJSON(data, res))
    } else if (/meta/i.test(m)) {
      console.log('命中meta POST接口 ....')
      metaService.getRawMetas(postData).then(meta => writeJSON(meta, res))
    } else if (/TS/i.test(m)) {
      console.log('命中TS POST接口 ....')
      console.log(postData)
      search.byTitle(postData).then(meta => writeJSON(meta, res))
    }
  }
})


function redirect (res, Location) {
  res.writeHead(302, { Location })
  res.end()
}

function pageNotFound (res) {
  res.writeHead(404)
  res.end('无此页面 ...')
}

function writeDoc (doc, res) {
  res.writeHead(200, {'Content-Type': 'text/html'})
  res.write(doc)
  res.end()
}

function writeJSON (json, res) {
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
