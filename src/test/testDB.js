const DB = require('../db/DB')

// DB.use('cms')
// DB.exec('SELECT * FROM diaodiao_article_meta WHERE id = 1').then(data => {
//   console.log('4:', data)
// })

// // DB.use('diaodiao')
// DB.exec('SELECT * FROM diaodiao_buyinfo WHERE aid = 2112').then(data => {
//   console.log('10:', data)
// })

// DB.exec('SELECT * FROM diaodiao_article_content WHERE aid = 1').then(data => {
//   console.log('14:', data)
// })
// DB.exec(`SELECT count(*) AS count FROM diaodiao_article_image WHERE aid = 1`).then(data => {
//   console.log(data)
// })
//
// DB.exec('SELECT * FROM diaodiao_article_meta where id = 1').then(data => {
//   console.log('13:', data)
// })
let data = `
目录
7352,买买买,评测必败清单

最新报告
10136,有调评测,防晒衣
10077,有调评测,蓝牙耳机
9829,有调评测,遮阳伞

你离女神只差这一步
6904,评测团,可撕指甲油
6782,有调评测,脱毛产品
6149,评测团,身体乳
7999,评测团,磨砂膏
2998,有调评测,梳子
8497,有调评测,电吹风
9270,有调评测,卫生巾
6676,评测团,无肩带内衣
6487,评测团,无痕内衣
6345,评测团,女士无痕内裤
7375,评测团,女士纯棉内裤
7877,评测团,丝袜
9829,有调评测,遮阳伞
9833,有调评测,防晒霜


成为男神从这里开始
8104,评测团,男士护肤品
9365,评测团,男士洗面奶
6540,有调评测,剃须刀
7068,评测团,男士内裤2.0
6569,评测团,男士内裤1.0
7242,达人测,男士纯棉内裤

好好学习，认真生活
10136,有调评测,防晒衣
10077,有调评测,蓝牙耳机
6425,有调评测,Kindle
6963,评测团,笔记本
9152,有调评测,中性笔
7119,评测团,情趣避孕套
5120,评测团,超薄避孕套
6337,评测团,漱口水
6834,评测团,口气清新喷雾
6624,评测团,解酒小物
5855,评测团,抽纸
6129,评测团,卷纸
7512,评测团,耳塞
3887,评测团,毛巾
7245,评测团,浴巾
7715,评测团,枕头
7185,有调评测,行李箱
7985,评测团,运动毛巾
6203,评测团,船袜


那些和吃喝有关的故事
8740,评测团,下饭酱
4192,评测团,泡面
5397,评测团,麦片
6367,有调评测,粽子

秋冬怎能少了它们
5678,评测团,袜子
8612,评测团,打底裤
8431,评测团,功能性秋裤
8110,有调评测,成人防霾口罩
8239,有调评测,儿童防霾口罩
8524,有调评测,空气净化器`
DB.exec(`UPDATE  diaodiao_article_content SET content = '${data}' WHERE aid = 7216`)
