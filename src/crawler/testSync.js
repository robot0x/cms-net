const fs = require('fs')
fs.readFile('./data/ajson.2017-05-30-11-49-34', 'UTF-8', (err, text) => {
  if (err) {
    console.log(err)
  } else {
    let list = text.trim().split(/\n/)
    console.log(list.length)
    let map = new Map()
    // let map = Object.create(null)
    for (let i = 0, l = list.length; i < l; i++) {
      let obj = JSON.parse(list[i])
      //   map[obj.node.nid] = i
      map.set(obj.node.nid, i)
    }
    let array = []
    let iterator = map.entries()
    let entry = null
    while ((entry = iterator.next().value)) {
      let index = entry[1]
      array.push(list[index])
    }
    fs.writeFileSync('./aaaaa', array.join('\n'), 'UTF-8')
  }
})
