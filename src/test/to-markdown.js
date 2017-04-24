const toMatkdown = require('to-markdown')
const html = require('./htmlString')
const Parser = require('../parser')

function htmlToMarkdown (html){
  return toMatkdown(html)
}

let markdown = htmlToMarkdown(html)
console.log(markdown)

const parse = new Parser(markdown)

console.log(parse.getHTML() === html)
