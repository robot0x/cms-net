// const Parser = require('../../../parser')

class TagParser {
  setMetas (metas) {
    this.metas = metas
    return this
  }

  getHTML () {
    let html = ''
    let { metas } = this
    // let metaslen = metas.length
    // if(metaslen > limit){
    //   metas = metas.slice(0, limit)
    // }
    for (let meta of metas) {
      let { cover_image_url, title, id, longid } = meta
      // <div class="articlecard" data-href="${url}">
      //   <img class="articleimg" src="${thumb_image_url}"/>
      //   <span class="articletitle">${title}</span>
      //   <span class="articleread" data-id="${id}">阅读 ...</span>
      // </div>
      // <hr class="articlesep">
      html += `
      <li class="content-list-item f-l">
        <dl>
          <dt class="loading">
            <a href="//www.diaox2.com/article/${id}.html" class="img-container" target="_blank"><img alt=">${title}" onload="adjust(this);"data-w="640" data-h="370" src="${cover_image_url}"></a>
        </dt>
          <dd>
            <p><a href="//www.diaox2.com/article/9668.html" target="_blank">${title}</a></p>
            <ul class="icon-list unknown clearfix" data-id="${longid}">
              <li class="icon-item f-l">
                <i class="icon icon-s"></i>
                <span class="a-fav">...</span>
              </li>
              <li class="icon-item f-l">
                <i class="icon icon-z"></i>
                <span class="a-up">..</span>
              </li>
              <li class="icon-item f-l">
                <i class="icon icon-p"></i>
                <span class="a-com">.</span>
              </li>
            </ul>
          </dd>
        </dl>
      </li>
      `
    }
    return html
  }
}

module.exports = TagParser
