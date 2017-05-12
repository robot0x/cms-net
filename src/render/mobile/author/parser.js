const Parser = require('../../../parser')

class AuthorParser{

  setMetas (metas) {
    this.metas = metas
    return this
  }

  getHTML (len) {
    let html = ''
    let { metas } = this
    // console.log('14:', metas)
    let metaslen = metas.length
    if(metaslen > len){
      metas = metas.slice(0, len)
    }
    for(let meta of metas) {
      html += `
        <div class="articlecard" data-href="//c.diax2.com/view/app/?m=show&id=${meta.nid}">
          <img class="articleimg" src="${meta.thumb_image_url}"/>
          <span class="articletitle">${meta.title.join('')}</span>
          <span class="articleread" data-id="${4294967297 * meta.nid}">阅读 ...</span>
        </div>
        <hr class="articlesep">
        <div id="relcardlast"></div>
      `
    }
    return html
  }
}

module.exports = AuthorParser
