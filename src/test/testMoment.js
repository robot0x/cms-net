const moment = require('moment')
let now = moment(20170503,'YYYYMMDD')
console.log(now)
console.log(now.valueOf())

let today = moment().format('YYYYMMDD')
console.log(today);
console.log(moment().subtract(1, 'days').format('YYYYMMDD'));
console.log(moment().subtract(1, 'days').valueOf());
