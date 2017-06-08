const run = require('./index')
const run2 = require('./insertMetaAndImage')
// const Promise = require('bluebird')
const Log = require('../utils/Utils')
const [file] = process.argv.splice(2)
async function callRun () {
  try {
    await run(file)
    await run2(file)
    console.log('-----------------------------------------------------')
  } catch (error) {
    console.log(error)
    Log.exception('[sync.js callRun]:', error)
  } finally {
    process.exit(0)
  }
}
callRun()
