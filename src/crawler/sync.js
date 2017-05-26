const exec = require('child_process').exec
const path = require('path')
const moment = require('moment')
const scpFile = path.resolve('./src/crawler/data', `ajson.${moment().format('YYYY-MM-DD-hh-mm-ss')}`)
// const fs = require('fs')
const run = require('./index')
const run2 = require('./insertMetaAndImage')
const scpCmd = `scp work@s3.a.dx2rd.com:~/view2/app/ajson ${scpFile}`
exec(scpCmd, (err, stdout, stderr) => {
  if (err) {
    console.log('get weather api error:', stderr)
  } else {
    // console.log(scpFile)
    // const data = fs.readFileSync(scpFile, 'utf-8')
    // console.log(String(data))
    run(scpFile)
    run2(scpFile)
  }
})
