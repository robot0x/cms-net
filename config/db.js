// module.exports = {
//     "host":"rm-2zez3wrjdyc22f44t.mysql.rds.aliyuncs.com",
//     "user":"cms_internal",
//     "password":"CmsInternal123",
//     "database":"cms_internal",
//     "charset":"utf8mb4",
//     "multipleStatement":true,
//     "connectionLimit": 15
//  }
const isDebug = process.env.NODE_ENV === 'dev'
const dbConfig = isDebug
  ? {
    host: 'localhost',
    user: 'root',
    password: 'sqltest',
    database: 'cms',
    charset: 'utf8mb4',
    multipleStatement: true,
    connectionLimit: 20
  }
  : {
    host: 'rds7bz3av7bz3av.mysql.rds.aliyuncs.com',
      //  reader是只读帐号，渲染相关的都是只需要读就可以了
      // 'user': 'reader',
      // 'password': 'reader',
    user: 'diaodiao',
    password: 'diaodiao',
    database: 'diaodiao',
    charset: 'utf8mb4',
    multipleStatement: true,
    // 在服务器上会报错：Too many connections。故由50改为20
    // 大叔说，这个数据库最多共有150条连接，大部分情况下110 ~ 120 条连接就够用了
    connectionLimit: 20
  }
// console.log(`isDebug:${isDebug}\nuse: ${JSON.stringify(dbConfig)}`)
module.exports = dbConfig

//  module.exports = {
//    'cms': {
//      'host': '172.16.1.121',
//      'user': 'root',
//      'password': 'sqltest',
//      'database': 'cms',
//      'charset': 'utf8mb4',
//      'multipleStatement': true,
//      'connectionLimit': 50
//    },
//   // 'cms': {
//   //   'host': 'rds7bz3av7bz3av.mysql.rds.aliyuncs.com',
//   //  //  reader是只读帐号，渲染相关的都是只需要读就可以了
//   //   'user': 'reader',
//   //   'password': 'reader',
//   //  //  'user': 'diaodiao',
//   //  //  'password': 'diaodiao',
//   //   'database': 'diaodiao',
//   //   'charset': 'utf8mb4',
//   //   'multipleStatement': true,
//   //   'connectionLimit': 50
//   // },
//   //  生成购买页需要读取 diaodiao 数据库
//    'diaodiao': {
//      'host': 'rds7bz3av7bz3av.mysql.rds.aliyuncs.com',
//     //  reader是只读帐号，渲染相关的都是只需要读就可以了
//      'user': 'reader',
//      'password': 'reader',
//     //  'user': 'diaodiao',
//     //  'password': 'diaodiao',
//      'database': 'diaodiao',
//      'charset': 'utf8mb4',
//      'multipleStatement': true,
//      'connectionLimit': 15
//    }
// }
