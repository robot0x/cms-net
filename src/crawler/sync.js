const run = require('./index')
const run2 = require('./insertMetaAndImage')
const [file] = process.argv.splice(2)
const Promise = require('bluebird')
async function callRun () {
  Promise
  .all([run(file), run2(file)])
  .then(() => {
    console.log('success ...')
  })
  .catch(e => {
    console.log(e)
  })
  .finally(() => {
    process.exit(0)
  })
}
callRun()
