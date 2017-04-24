const Promise = require('bluebird')
const fs = require('fs')
const request = require('request')

// console.log(123)
// Promise.resolve(456).then(id => console.log(id))
// console.log(789)
//
// const read = (file) => {
//   a + b
//   return Promise.promisify(fs.readFile)(file, 'utf8')
// }
//
// const parse = (text) => {
//   return String(text) + 333121
// }
//
// const write = (text) => {
//   return Promise.promisify(fs.writeFile)('./test.1', text, 'utf8')
// }
// read('../crawler/data/nidlist.1').then(parse).then(write)

// const flow = async (file) => {
//   try {
//     const text = await read(file)
//   } catch (e) {
//     console.log('26:', e)
//   }
//   const paredText = parse(text)
//   write(paredText)
// }
//
// flow('../crawler/data/nidlist.1')


const read = (file, cb) => {
  fs.readFile(file, 'utf8', (err, url) => {
   if(err){
     console.error(err)
   } else {
     console.log('45:', url)
     cb(url)
   }
  })
}

const download = (url, cb) => {
  request(url, (err, response, json) => {
     if (!err && response.statusCode === 200) {
        cb(json)
     } else {
        console.error(err)
      }
    })
}

const parse = (res) => {
 const obj = JSON.parse(res)
 obj.age++
 return JSON.stringify(obj)
}

const write = (text, file = './json.file') => {
  fs.writeFile(file, text, 'utf8', (err) => {
    console.error(err)
  })
}

read('./url.file', (url) => {
   download(url, (res) => {
    const str = parse(res)
    write(str)
  })
})
