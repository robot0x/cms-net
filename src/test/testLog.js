const Log = require('../utils/Log')
Log.exception('这是一个异常')
Log.business('这是一条业务日志')
console.log('这是一条控制台log ...')
console.info('这是一条控制台info ...')
console.error('这是一条控制台error ...')

try {
  throw new Error('测试会不会把文件名及函数打印出来')
} catch (e) {
  Log.exception(e)
} finally {

}
