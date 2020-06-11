import { connect } from "./connect"
import { Value } from "./channel"

export const put = async (pvname: string, value: Value): Promise<void> => {
  const channel = await connect(pvname)
  await channel.put(value)
  await channel.disconnect()
}
