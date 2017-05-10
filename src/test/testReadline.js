const lineReader = require('readline').createInterface({
  input: require('fs').createReadStream('../crawler/data/nidlist'),
  output: process.stdout,
  terminal: false
})

let arr = []
let reg = /\d+/

lineReader.on('line', line => {
  if(line && line.trim()){
    arr.push(line.match(reg)[0])
  }
})

lineReader.on('close', () => {
  console.log('文件读取完毕，idlist为：', arr)
})

// 经过测试，readline是读取一行触发line事件，然后再读取一行，再触发line事件，不是一次性地触发多次line事件
