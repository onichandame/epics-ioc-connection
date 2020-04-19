import { connect } from './connect'
import { Channel } from './channel'

export const get = async (pvname: string): ReturnType<Channel['get']> => {
  const channel = await connect(pvname)
  const value = await channel.get()
  console.log('disconnecting')
  await channel.disconnect()
  console.log('disconnected')
  return value
}
