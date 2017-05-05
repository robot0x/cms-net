const cheerio = require('cheerio')

const $ = cheerio.load(`
  <div id="container">
    <div id="container">
    <p>CMS系统支持的浏览器为（排名有先后）：</p>
    <ol>
    <li>Chrome</li>
    <li>Safari</li>
    <li>Opera</li>
    <li>Firefox</li>
    <li>Edge</li>
    <li>IE9以上的浏览器</li>
    </ol>
    <p>CMS系统的特点是：</p>
    <ul>
    <li>markdown实时渲染，编辑可迅速看到大致的渲染效果</li>
    <li>文章有本地缓存，若忘记保存，下次进来优先加载本地缓存</li>
    <li>其他的也想不起来了。</li>
    </ul>
    <blockquote>
    <p>本文约3900字，完整阅读需9分钟，口罩推荐可直接前往<a target="_blank" href="http://www.diaox2.com/article/8110.html">http://www.diaox2.com/article/8110.html</a>
    目录</p>
    <ol>
    <li>雾霾和我<ul>
    <li>雾霾和我有关系吗？</li>
    <li>面对雾霾，我们可以做什么？</li>
    </ul>
    </li>
    <li>关于调²研室</li>
    <li>测评选品<ul>
    <li>史上最全口罩测评</li>
    </ul>
    </li>
    <li>测评维度<ul>
    <li>过滤性</li>
    <li>密合性</li>
    </ul>
    </li>
    <li>购买指导<ul>
    <li>有调之选</li>
    <li>大脸朋友的性价比之选</li>
    <li>小脸朋友的性价比之选</li>
    <li>一个彩蛋</li>
    </ul>
    </li>
    </ol>
    </blockquote>
    <p>这是插入图片：</p>
    <p><img src="http://content.image.alimmdn.com/cms/sites/default/files/20170322/firstpage/heying.JPG@768w_1l" alt=""></p>
    <p>文章内容直接在这儿写，例如：</p>
    <p>「有调」正在成为一个极致生活用品的消费决策指南</p>
    <p>为那些不肯将就的你找到书写最顺畅的笔、穿着最透气的袜子、真的有用的防雾霾口罩，让你使用的都是最安全、最放心、功能性最强的产品；</p>
    <h2>这是大红条标题</h2><p>天王盖地虎哦，宝塔震河妖</p>
    <h3>这是小红条标题</h3><p>滁河日党务，旱地和下土</p>
    <p><span style="color:red;">我是红色的字体</span></p>
    <p><del>我是有删除线的文本</del></p>
    <p><em>斜体</em></p>
    <p><strong>粗体</strong></p>
    <p><u>我是有下划线的文字</u></p>
    <blockquote>
    <p>这是内容引用，前面加一个“&gt;”和空格即可</p>
    </blockquote>
    <p>这个段落中含有我们的其他<a target="_blank" href="//www.diaox2.com/article/9466.html">//www.diaox2.com/article/9466.html</a>，只需要在&quot;()”填写我们的文章id即可</p>
    <p>这个段落中含有引用非文章<a target="_blank" href="http://www.diaox2.com">http://www.diaox2.com</a></p>
    <p>技术支持：有问题报给@李彦峰（大哥）</p>
  </div>
  </div>
`,{
  decodeEntities: false
})


const container = $('#container')
/**
 * [htmlToData 输入一段html文本，输出一段对应的数据片段]
 * @param  {[jQuery Object]}  container
 * @param  {Boolean} [root=true] [第一次调用 root 为true]
 * @return {[Array]} [返回container下所有字节点的数据片段]
 */
function htmlToData(container, root = true){
  const contents = []
  let children = null
  const contain = container.get(0)
  // 如果是第一次调用 或者 ul/ol ，则取所有的dom节点
  if(root || /ul|ol/.test(contain.name)){
    children = container.children()
  } else {
    // 否则取所有的节点，包括文本节点
    children = contain.childNodes
  }
  children = Array.from(children)
  for(let child of children){
    console.log('child.type:', child.type)
    console.log('child.name:', child.name)
    let item = {}
    let {type, name, data, attribs} = child
    // 只处理tag和text节点
    if(type === 'tag'){
      item.type = name
      let childNodes = child.childNodes
      if (name === 'a') {
         item.url = attribs.href
       }else if (name === 'span' && attribs.style) {
         item.style = attribs.style
       }
      const doms = Array.from($(child).children())
      // 若child下有且仅有一个文本节点，则直接把文本节点值赋予value
      if(childNodes.length === 1 && childNodes[0].type === 'text'){
        item.value = childNodes[0].data
      } else if(doms.length === 1 && doms[0].name === 'img') {
        // 若含有其他节点，则递归调用htmlToData
        let [imgDom] = doms
        let imgAttr = imgDom.attribs
        item.type = imgDom.name
        item.value = imgAttr.alt || ''
        item.url = imgAttr.src
        item.width = imgAttr.width || ''
        item.height = imgAttr.height || ''
      } else {
        // 若含有其他节点，则递归调用htmlToData
        item.value = htmlToData($(child), false)
      }
    }else if(type === 'text'){
      item.type = type
      item.value = data
    }
    contents.push(item)
  }
  return contents
}

console.log(JSON.stringify(htmlToData(container)))
