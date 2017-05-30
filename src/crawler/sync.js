const exec = require('child_process').exec
const path = require('path')
const moment = require('moment')
const scpFile = path.resolve(
  './src/crawler/data',
  `ajson.${moment().format('YYYY-MM-DD-hh-mm-ss')}`
)
const fs = require('fs')
const run = require('./index')
const run2 = require('./insertMetaAndImage')
const isDebug = process.env.NODE_ENV === 'dev'
const scpCmd = isDebug
  ? `scp work@s3.a.dx2rd.com:~/view2/app/ajson ${scpFile}`
  : `cp ~/view2/app/ajson ${scpFile}`
const ENCODING = 'utf8'
exec(scpCmd, (err, stdout, stderr) => {
  if (err) {
    console.log('get weather api error:', stderr)
  } else {
    fs.readFile(scpFile, ENCODING, (err, text) => {
      if (err) {
        console.log(err)
      } else {
        // 数据去重，只取最后一个
        let list = text.trim().split(/\n/)
        let map = new Map()
        for (let i = 0, l = list.length; i < l; i++) {
          let obj = JSON.parse(list[i])
          map.set(obj.node.nid, i)
        }
        let array = []
        let iterator = map.entries()
        let entry = null
        while ((entry = iterator.next().value)) {
          let index = entry[1]
          array.push(list[index])
        }
        let uniqFile = `${scpFile}.uniq`
        fs.writeFileSync(uniqFile, array.join('\n'), ENCODING)
        run2(uniqFile)
        // fs.writeFile(uniqFile, array.join('\n'), ENCODING, err => {
        //   if (err) {
        //     console.log(err)
        //   } else {
        //     // run(uniqFile)
        //     run2(uniqFile)
        //   }
        // })
      }
    })
  }
})
