import { Channel } from './channel'

export const connect = async (pvname: string): Promise<Channel> => {
  const ca = new Channel(pvname)
  await ca.connect()
  return ca
}
