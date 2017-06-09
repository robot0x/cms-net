class Base {
  setDebug (debug = false) {
    this.debug = !!debug
    return this
  }
  setLogid (logid) {
    this.logid = logid
    return this
  }
  setControlData (arg) {
    let { debug, logid } = arg
    this.setDebug(debug)
    this.setLogid(logid)
    return this
  }
}

module.exports = Base
