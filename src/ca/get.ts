import { connect } from './connect'
import { Channel } from './channel'

export const get = async (pvname: string): ReturnType<Channel['get']> => {
  const ca = await connect(pvname)
  const value = await ca.get()
  await ca.disconnect()
  return value
}
