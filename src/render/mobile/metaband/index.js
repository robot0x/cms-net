const Render = require('../../')
const Utils = require('../../../utils/Utils')
const MetaService = require('../../../service/MetaService')
const metaService = new MetaService()
const Log = require('../../../utils/Log')
/**
 * 渲染：
 *  1. http://c.diaox2.com/view/app/?m=metaband&id=1234
 */
class MetabandRender extends Render {
  setId (id) {
    this.id = id
    return this
  }
  async rende (id = this.id) {
    try {
      const meta = await metaService.getRawMetas(id, false, true)
      const { nid, thumb_image_url, title } = meta
      const url = `${this.prefix}/view/app/?m=show&id=${nid}`
      return `
      <div class="relcard" data-href="${url}" data-render="${this.version}" data-action="" data-fn="">
        <a href="${url}">
          <div class="relpic">
            <img src="${thumb_image_url}" />
          </div>
          <div class="reltext">
            <span class="cardtitle">${Utils.getFirst(title)}</span>
            <span class="cardread" data-id="${Utils.toLongId(nid)}">阅读 ...</span>
          </div>
        </a>
      </div>
      <div class="clearfix"></div>
      <hr class="sep">`
    } catch (e) {
      Log.exception(e)
      return null
    }
  }
}

module.exports = MetabandRender
