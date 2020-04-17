const { Channel } = require('.')

const channel = new Channel('xiaoHost:ai1');

(async () => {
  try {
    await channel.connect({ timeout: 1000 })
    console.log(await channel.get({ fieldType: 0 }))
    await channel.disconnect()
  } catch (e) {
    console.log(e)
  }
})()
setTimeout(() => console.log('finished'), 5000)
