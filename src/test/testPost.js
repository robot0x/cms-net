const request = require('request')
// http://bj2.a.dx2rd.com:3000/jf/inviter
function getRenderData(uid) {
  return new Promise((resolve, reject) => {
    request({
      url: 'http://bj2.a.dx2rd.com:3000/jf/inviter',
      method: "POST",
      json: true,
      headers: {
        "content-type": "application/json"
      },
      body: { uid }
    }, (error, response, body) => {
      if(error) reject(error)
      if(response.statusCode == 200) {
        resolve(body)
      } else {
        reject('接口返回错误的状态吗', response.statusCode)
      }
    })
  })
}

getRenderData(42).then(data => console.log(data))
