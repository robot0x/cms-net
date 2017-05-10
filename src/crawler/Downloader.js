/*
 * @Author: liyanfeng
 * @Date: 2017-04-18 14:44:46
 * @Last Modified by: liyanfeng
 * @Last Modified time: 2017-05-10 21:59:27
 *  为了减轻服务器的压力，要使异步任务顺序化，而不是近1W个url一次性地请求完
 *  请求完一个url，并成功返回结果，才接着请求下一个url
 */
const request = require('request')
const Promise = require('bluebird')
const Log = require('../utils/Log')
const runLogger = Log.getLogger('cms_run')

class Downloader {
  // max为连接池的长度
  constructor (urls, max = 1) {
    this.set (urls, max)
  }

  set (urls, max = 1) {
    // console.log('urls: ', urls);
    this.urls = urls
    this.index = 0
    this.pool = 0
    this.max = max
  }

  fetch (url) {
    return new Promise((resolve, reject) => {
      // console.log(`开始下载${url} ....`)
      request(url, (err, response, body) => {
        try {
          if (!err && response.statusCode === 200) {
            // console.log(`下载${url}完毕 ....`)
            return resolve(body)
          } else {
            console.log(err)
            runLogger.error(`url为${url}的文章download出错，出错信息：`, e.message)
            reject(err)
          }
        } catch (e) {
          console.log(err)
          runLogger.error(`url为${url}的文章download出错，出错信息：`, e.message)
          reject(e)
        }
      })
    })
  }

  async download (handler) {

    let currentIndex = this.index
    if (currentIndex >= this.urls.length) {
      return
    }

    let currentUrl = this.urls[currentIndex]
    this.index += 1

    let promise = this.fetch(currentUrl)
    this.pool += 1

    if (this.pool < this.max) {
      this.download(handler)
    }

    handler(await promise, currentUrl, currentIndex)
    this.pool -= 1
    this.download(handler)
  }
}


module.exports = Downloader
