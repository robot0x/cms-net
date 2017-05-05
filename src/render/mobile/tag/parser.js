const Parser = require('../../../parser')

class TagParser{
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
      let {url, thumb_image_url, title, id } = meta
      html += `
        <div class="articlecard" data-href="${url}">
          <img class="articleimg" src="${thumb_image_url}"/>
          <span class="articletitle">${title}</span>
          <span class="articleread" data-id="${id}">阅读 ...</span>
        </div>
        <hr class="articlesep">
      `
    }
    return html
  }
}

module.exports = TagParser
