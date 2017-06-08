const run = require('./index')
const run2 = require('./insertMetaAndImage')
const [file] = process.argv.splice(2)
const Promise = require('bluebird')
const Log = require('../utils/Utils')
async function callRun () {
  Promise
  .all([run(file), run2(file)])
  .then(() => {
    console.log('success ...')
  })
  .catch(e => {
    console.log(e)
    Log.exception('[sync.js callRun]:', e)
  })
  .finally(() => {
    process.exit(0)
  })
}
callRun()
