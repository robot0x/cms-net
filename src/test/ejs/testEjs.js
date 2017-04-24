const ejs = require('ejs')
const fs = require('fs')
const ejsString = String(fs.readFileSync('show.ejs'))

const data = {
  name: '李彦峰'
}
// 第一种渲染方式
let template = ejs.compile(ejsString)
let html = template(data)
console.log(html)

// 第二种渲染方式
html = ejs.render(ejsString, data)
console.log(html)
