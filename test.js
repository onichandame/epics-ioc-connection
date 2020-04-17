const { Channel } = require('.')

const channel = new Channel('xiaoHost:ai1');

(async () => {
  try {
    await channel.connect()
    console.log(await channel.get())
    await channel.disconnect()
  } catch (e) {
    console.log(e)
  }
})()
