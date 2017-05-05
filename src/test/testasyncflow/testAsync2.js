
const getSku = async (name) => {
  if(name === '李彦峰'){
      return 'done'
  }else {
    throw new Error('name必须为李彦峰')
  }
}

const sku = getSku('李彦峰2').then(str => console.log(str)).catch(e => console.log(e))
