const run2 = require('./fixImageDeleteBug_InsertImage')
const Log = require('../utils/Utils')
const [file] = process.argv.splice(2)
async function callRun () {
  try {
    await run2(file)
  } catch (error) {
    console.log(error)
    Log.exception('[sync.js callRun]:', error)
  } finally {
    process.exit(0)
  }
}
callRun()
