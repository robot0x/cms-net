const fs = require('fs')
const Table = require('../db/Table')
const table = new Table('article_meta', ['aid', 'content'])

const f = () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      resolve('Promise内的setTimeout执行了 ....')
    }, 2000)
  })
}

const testAsync = async () => {
  const t = await f()
  console.log(t)
}

testAsync()
// table.exec('select id from article_meta limit 10;').then(data => {
//   console.log(data)
// })
const getData = async () => {
  const ids = await table.exec('select id from article_meta limit 10')
  console.log(ids)
}

getData()
