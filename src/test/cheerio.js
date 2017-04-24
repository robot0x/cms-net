const cheerio = require('cheerio')
const html = require('./htmlString')
const $ = cheerio.load(
  `<div id="container">
     ${html}
   </div>`,{
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
  // 如果是第一次调用 或者 ul ol等，则取所有的dom节点
  if(root || /ul|ol/.test(contain.name)){
    children = container.children()
  } else {
    // 否则取所有的节点，包括文本节点
    children = contain.childNodes
  }
  children = Array.from(children)
  for(let child of children){
    let item = {}
    let {type, name, data, attribs} = child
    // 只处理tag和text节点
    if(type === 'tag'){
      item.type = name
      let childNodes = child.childNodes
      let isImg = false
      if (name === 'img') {
         item.value = attribs.alt || ''
         item.url = attribs.src
         item.width = attribs.width || ''
         item.height = attribs.height || ''
         isImg = true
       } else if (name === 'a') {
         item.url = attribs.href
       }else if (name === 'span' && attribs.style) {
         item.style = attribs.style
       }
      // 若child下有且仅有一个文本节点，则直接把文本节点值赋予value
      if(childNodes.length === 1 && childNodes[0].type === 'text'){
        item.value = childNodes[0].data
      } else if(!isImg) {
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
