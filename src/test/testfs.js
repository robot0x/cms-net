const fs = require('fs')
fs.writeFile('./views/append.app', '你好，，再见', 'utf8', err => {
  if(err){
    console.log(err)
  }
})
