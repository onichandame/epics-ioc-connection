const { CA } = require('.');

(async () => {
  try {
    console.log('connecting')
    const channel = await CA.connect('xiao:aiExample', { timeout: 1000 })
    console.log('connected')
    setTimeout(async () => {
      console.log('disconnecting')
      await channel.disconnect()
      console.log('disconnected')
    }, 1000)
  } catch (e) {
    console.log(e)
  }
})()
