import {connect} from './connect'

export const get=async (pvname: string)=>{
  const ca=await connect(pvname)
  return await ca.get()
}
