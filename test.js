const { Channel } = require('.')

const channel = new Channel('xiaoHost:ai1');

(async () => {
  try {
    await channel.connect()
    await channel.monitor()
    channel.on('value', data => console.log(data))
  } catch (e) {
    console.log(e)
  }
})()
