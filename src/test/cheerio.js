const cheerio = require('cheerio')
/**
 cheerio对象：
{
  '0': 
   { type: 'tag',
     name: 'p',
     attribs: { id: 'p' },
     children: [ [Object], [Object], [Object] ],
     next: 
      { data: '\n    ',
        type: 'text',
        next: null,
        prev: [Circular],
        parent: [Object] },
     prev: 
      { data: '\n    ',
        type: 'text',
        next: [Circular],
        prev: [Object],
        parent: [Object] },
     parent: 
      { type: 'tag',
        name: 'head',
        attribs: {},
        children: [Object],
        next: [Object],
        prev: [Object],
        parent: [Object] } },
  options: 
   { decodeEntities: false,
     withDomLvl1: true,
     normalizeWhitespace: false,
     xmlMode: false },
  _root: 
   initialize {
     '0': 
      { type: 'root',
        name: 'root',
        attribs: {},
        children: [Object],
        next: null,
        prev: null,
        parent: null },
     options: 
      { decodeEntities: false,
        withDomLvl1: true,
        normalizeWhitespace: false,
        xmlMode: false },
     length: 1,
     _root: [Circular] },
  length: 1,
  prevObject: 
   initialize {
     '0': 
      { type: 'root',
        name: 'root',
        attribs: {},
        children: [Object],
        next: null,
        prev: null,
        parent: null },
     options: 
      { decodeEntities: false,
        withDomLvl1: true,
        normalizeWhitespace: false,
        xmlMode: false },
     length: 1,
     _root: [Circular] } }

 */
const $ = cheerio.load(
  ` <!DOCTYPE html>
    <html lang="en">
    <head>
    <meta charset="UTF-8">
    <title>Document</title>
    <p id="p" class="test" data-attr="hhh">这<br>是&nbsp;一段&amp;话</p>
    <h2>你好</h2>
    </head>
    <body>
    </body>
    </html>`,
  {
    decodeEntities: false,
    normalizeWhitespace: false
  }
)
// console.log($('#p'))
// console.log($('#p').attr('class'))
// console.log($('#p')[0].attribs['class'])
// console.log($('#p').text())
console.log($('#h4')[0])
// console.log($('h2'))
