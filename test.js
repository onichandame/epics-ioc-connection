const { Channel } = require('./dist')

const channel = new Channel('xiaoHost:ai1');

(async () => {
  await channel.connect({ timeout: 1000 })
  console.log(await channel.get({ fieldType: 0 }))
})()
