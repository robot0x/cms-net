const moment = require('moment')
// let now = moment(20170503,'YYYYMMDD')
// console.log(now)
// console.log(now.valueOf())
//
// let today = moment().format('YYYYMMDD')
// console.log(today);
// console.log(moment().subtract(1, 'days').format('YYYYMMDD'));
// console.log(moment().subtract(1, 'days').valueOf());

const mom = new Date(moment(20141220, 'YYYYMMDD'))
console.log(mom);

var tommorrow = moment().add(1, 'days')
console.log(tommorrow.format('YYYYMMDD'))
console.log(tommorrow);
