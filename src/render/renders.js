const renderDir = '.'
const mobileRenderDir = `${renderDir}/mobile`
const pcRenderDir = `${renderDir}/pc`
// 移动端渲染器类集合
const MShowRender = require(`${mobileRenderDir}/show/`) // firstpage/goodthing/exprience
const MZKRender = require(`${mobileRenderDir}/zk/`) // 专刊
const MZTRender = require(`${mobileRenderDir}/zt/`) // 专题
const MAuthorRender = require(`${mobileRenderDir}/author/`) // 作者页
const MTagRender = require(`${mobileRenderDir}/tag/`) // tag页
const MBuyRender = require(`${mobileRenderDir}/buy/`) // 购买页
const MSkuRender = require(`${mobileRenderDir}/sku/`) // sku页
const MRssRender = require(`${mobileRenderDir}/rss/`) // rss聚合页
const MInviteRender = require(`${mobileRenderDir}/invite/`) // rss聚合页
const MJfitemRender = require(`${mobileRenderDir}/jfitem/`) // 积分单品页
const MJfMallRender = require(`${mobileRenderDir}/jfmall/`) // 积分商城页
const MZDMRender = require(`${mobileRenderDir}/zdm/`) // 值得买活动页
const MMetabandRender = require(`${mobileRenderDir}/metaband/`) // 文章列表条html,生成一条类似app内tag/author页上的文章条，直接返回html
const MPCollectionRender = require(`${mobileRenderDir}/pcollection/`) // 测评集合页渲染
// PC端渲染器类集合
const PShowRender = require(`${pcRenderDir}/show/`) // 好物页
const PZKRender = require(`${pcRenderDir}/zk/`) // 专刊
const PAuthorRender = require(`${pcRenderDir}/author/`)
const PTagRender = require(`${pcRenderDir}/tag`)

// 导出所有渲染器的实例，在 /router.js中引用
module.exports = {
  // 移动端渲染器组
  mShowRender: new MShowRender(),
  mZKRender: new MZKRender(),
  mZTRender: new MZTRender(),
  mAuthorRender: new MAuthorRender(),
  mTagRender: new MTagRender(),
  mBuyRender: new MBuyRender(),
  mSkuRender: new MSkuRender(),
  mRssRender: new MRssRender(),
  mInviteRender: new MInviteRender(),
  mJfitemRender: new MJfitemRender(),
  mJfMallRender: new MJfMallRender(),
  mZDMRender: new MZDMRender(),
  mMetabandRender: new MMetabandRender(),
  mPCollectionRender: new MPCollectionRender(),
  // PC端渲染器组
  pShowRender: new PShowRender(),
  pZKRender: new PZKRender(),
  pAuthorRender: new PAuthorRender(),
  pTagRender: new PTagRender()
}
