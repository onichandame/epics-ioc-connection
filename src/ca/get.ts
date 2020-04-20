import { connect } from './connect'
import { Channel } from './channel'

export const get = async (pvname: string): ReturnType<Channel['get']> => {
  const channel = await connect(pvname)
  const value = await channel.get()
  await channel.disconnect()
  return value
}
