const moment = require('moment')
// let now = moment(20170503,'YYYYMMDD')
// console.log(now)
// console.log(now.valueOf())
//
// let today = moment().format('YYYYMMDD')
// console.log(today);
// console.log(moment().subtract(1, 'days').format('YYYYMMDD'));
// console.log(moment().subtract(1, 'days').valueOf());

// const mom = new Date(moment(20141220, 'YYYYMMDD'))
// console.log(mom);
// var tommorrow = moment().add(1, 'days')
// console.log(tommorrow.format('YYYYMMDD'))
// console.log(tommorrow);

// Cache-Control:max-age=86400
// Date:Thu, 11 May 2017 06:06:47 GMT
// Last-Modified:Thu, 11 May 2017 06:06:47 GMT
// Expires:Fri, 12 May 2017 06:06:47 GMT

// let pattern = 'ddd, D MMM YYYY HH:mm:ss GMT'
// let now = moment().utcOffset(0)
// let date = now.format(pattern)
// let expires = now.add(86400, 's').format(pattern)
// console.log('date   :', date)
// console.log('expires:', expires)

let timetopublish = moment('20141108', 'YYYYMMDD')
let timestamp = timetopublish.valueOf()
console.log('timetopublish string:', timetopublish.format('YYYY-MM-DD'))
console.log('timestamp:', timestamp)
console.log('new Date:', new Date(timestamp))
