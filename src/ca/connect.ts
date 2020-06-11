import { Channel } from "./channel"

export const connect = async (
  pvname: string,
  { timeout = 2000 } = {}
): Promise<Channel> => {
  const ca = new Channel(pvname)
  await ca.connect({ timeout })
  return ca
}
