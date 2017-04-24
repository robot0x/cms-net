const Render = require('../Render')
const fs = require('fs')
/**
 * 渲染：
 *  1. 首页 goodthing (ctype = 1)    http://c.diaox2.com/view/app/?m=show&id=9669
 *  2. 好物 firstpage (ctype = 2)    http://c.diaox2.com/view/app/?m=show&id=5344
 *  3. 经验 experience (ctype = 1)   http://c.diaox2.com/view/app/?m=show&id=1022
 *  3. 活动 activity (ctype = 1)   http://c.diaox2.com/view/app/?m=show&id=1022
 */
class ShowRender extends Render {
  constructor (id) {
    super(id)
    this.template = String(fs.readFileSync('./show.ejs', 'UTF-8'))
  }
  
  render () {
    const id = this.id
    console.log(id)
  }
}

var show = new ShowRender(123)
// console.log(show.template)
console.log(show.id)

module.exports = ShowRender
