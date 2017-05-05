const Parser = require('../../../parser')

class RssParser{
  setMetas (metas) {
    this.metas = metas
    return this
  }

  getHTML (limit) {
    let html = ''
    let { metas } = this
    let metaslen = metas.length
    if(metaslen > limit){
      metas = metas.slice(0, limit)
    }
    for(let meta of metas) {
      let {id, title, longid, thumb_image_url } = meta
      html += `
      <div class="articlecard" data-href="//c.diaox2.com/view/app/?m=zk&id=${id}">
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
