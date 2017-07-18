const cache = {
  /**
   * /?m=show&id=1 缓存时间为一天
   * 正文页，包括firstpage、goodthing、exprience
   */
  show: {
    maxAge: 86400
  },
  /**
   * /?m=zk&id=3053 缓存时间为一天
   * 专刊正文页
   */
  zk: {
    maxAge: 86400
  },
  /**
   * /?m=zt&id=7080 缓存时间为一天
   * 专题正文页
   */
  zt: {
    maxAge: 86400
  },
  /**
   * /?m=tag&tid=100000 缓存时间为一天
   * tag页
   */
  tag: {
    // maxAge: 86400
    maxAge: 43200 // 12小时
  },
  /**
   * /?m=author&src=ZRJ 缓存时间为一天
   * 作者页
   */
  author: {
    maxAge: 86400
  },
  /**
   * /share/4294967297.html 缓存时间为一天
   * 正文页的分享页
   */
  showShare: {
    maxAge: 86400
  },
  /**
   * /share/13112535157741.html=
   * 专刊正文页的分享页
   */
  zkShare: {
    maxAge: 86400
  },
  /**
   * /share/30408368462760.html
   * 专题正文页的分享页
   */
  ztShare: {
    maxAge: 86400
  },

  /**
   * /?m=buy&aid=2113
   * 购买页
   */
  buy: {
    maxAge: 86400
  },

  /**
   * /?m=sku&sid=2113
   * /sku/2113.html
   * /sku/longid/2113.html
   * /sku/shortid/2113.html
   * sku页
   */
  sku: {
    maxAge: 7200
  },
  /**
   * /?m=rss&type=firstpage|zhuankan|zhuanti
   * RSS聚合页
   */
  rss: {
    maxAge: 86400
  },
  /**
   * /?m=jfmall
   * 积分商城页
   */
  jfmall: {
    maxAge: 86400
  },

  /**
   * /mall.html
   * 积分商城页
   */
  jfmallShare: {
    maxAge: 86400
  },
  /**
   * /?m=jfitem&gid=102
   * 积分单品页
   */
  jfitem: {
    maxAge: 86400
  },
  /**
   * /invite/42.html
   * 邀请页
   */
  invite: {
    maxAge: 86400
  },
  /**
   * /zdmactivity/3705525985159720.html
   * /zdmactivity/3705525985159720_longid.html
   * 值得买活动页
   */
  zdmactivity: {
    maxAge: 86400
  },
  /**
   * /zdmshare/3705525985159720.html
   * /zdmshare/3705525985159720_longid.html
   * 值得买活动页的分享页
   */
  zdmshare: {
    maxAge: 86400
  },

  /**
   * /article/1.html
   * PC站正文页
   */
  article: {
    maxAge: 86400
  },

  /**
   * /article/3063.html
   * PC站专刊页
   */
  pc_zk: {
    maxAge: 86400
  },

  /**
   * /category/100000.html
   * PC站tag页
   */
  category: {
    maxAge: 172800 // 2天
  },

  /**
   * /editor/ZRJ.html
   * PC站作者页
   */
  editor: {
    maxAge: 86400
  },

  /**
   * GET /?m=relsearch&id=1234
   * 相关搜索接口
   * 缓存4个小时
   */
  relsearch: {
    maxAge: 14400
  },

  /**
   * GET /?m=recommend&id=1234
   * 推荐接口
   * 缓存4个小时
   */
  recommend: {
    maxAge: 14400
  },

  /**
   * GET /?m=metaband&id=1234
   * 推荐接口
   */
  metaband: {
    maxAge: 3600
  },

  /**
   * GET /?m=TR&start=20170325&end=20170330
   * 按date搜索接
   */
  TR: {
    maxAge: 3600
  },

  /**
   * POST /?m=TS
   * 按title搜索接口
   * postData格式为：调料
   */
  TS: {
    maxAge: 3600
  },

  /**
   * POST /?m=genpub
   */
  genpub: {
    maxAge: 3600
  },

  /**
   * GET /?m=meta&id=1
   * meta接口
   */
  meta_get: {
    maxAge: 3600
  },

  /**
   * POST /?m=meta
   * meta接口
   * 格式为：{"cids": [1, 2, 3 ....]} 文章长短id皆可
   */
  meta_post: {
    maxAge: 3600
  },

  /**
   * POST /show
   * meta接口
   */
  app_show: {
    maxAge: 3600
  }
}

module.exports = cache
