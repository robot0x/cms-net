const Parser = require('../../../parser')
const Utils = require('../../../utils/Utils')

class RssParser{
  setMetas (metas) {
    this.metas = metas
    // console.log(metas);
    return this
  }

  getHTML (limit) {
    let html = ''
    let { metas } = this
    let metaslen = metas.length
    if (metaslen > limit) {
      metas = metas.slice(0, limit)
    }
    for(let meta of metas) {
      let {id, title, longid, thumb_image_url, ctype } = meta
      // console.log(id);
      html += `
      <div class="articlecard" data-href="//c.diaox2.com/view/app/?m=${Utils.ctypeToM(ctype)}&id=${id}">
				<img class="articleimg" src="${thumb_image_url}" />
				<span class="articletitle">${title}</span>
				<span class="articleread" data-id="${longid}">阅读 ...</span>
			</div>
			<hr class="articlesep">
      `
    }
    return html
  }
}

module.exports = RssParser
