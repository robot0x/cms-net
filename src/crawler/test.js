const fs = require('fs')
const [file] = process.argv.splice(2)
setTimeout(() => {
  console.log(file)
  read(file)
}, 1000)

function read (file) {
  fs.readFile(file, 'utf8', (err, txt) => {
    if (err) {
      console.log(err)
    }
    console.log(txt)
  })
}
