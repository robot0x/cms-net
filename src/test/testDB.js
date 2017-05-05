const DB = require('../db/DB')

// DB.use('cms')
DB.exec('SELECT * FROM article_meta WHERE id = 1').then(data => {
  console.log('4:', data)
})

// DB.use('diaodiao')
DB.exec('SELECT * FROM diaodiao_buyinfo WHERE aid = 2112').then(data => {
  console.log('10:', data)
})

DB.exec('SELECT * FROM article_content WHERE aid = 1').then(data => {
  console.log('14:', data)
})
//
// DB.exec('SELECT * FROM article_meta where id = 1').then(data => {
//   console.log('13:', data)
// })
