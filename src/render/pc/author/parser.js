// const Parser = require('../../../parser')

class AuthorParser {
  setMetas (metas) {
    this.metas = metas
    return this
  }

  getHTML (len) {
    let html = ''
    let { metas } = this
    let metaslen = metas.length
    if (metaslen > len) {
      metas = metas.slice(0, len)
    }
    for (let meta of metas) {
      html += `
        <li class="article clearfix">
          <a href="//www.diaox2.com/article/${meta.nid}.html">
            <img alt="${meta.title}" src="${meta.thumb_image_url}" width="150" height="150" class="f-l">
            <div class="article-detail f-l">
              <h2 class="article-title">${meta.title}</h2>
              <ul class="article-keywords clearfix" style="visibility:hidden;">
                <li class="f-l"><span class="target-word">keywords</span></li>
              </ul>
              <ul class="zs-box2 clearfix unknown" data-id="${4294967297 * meta.nid}">
                <li class="f-l">
                  <i class="icon icon-s"></i>
                  <span class="count a-fav">...</span>
                </li>
                <li class="f-l">
                  <i class="icon icon-z"></i>
                  <span class="count a-up">..</span>
                </li>
                <li class="f-l">
                  <i class="icon icon-p"></i>
                  <span class="count a-com">.</span>
                </li>
              </ul>
            </div>
          </a>
        </li>
      `
    }
    return html
  }
}

module.exports = AuthorParser
