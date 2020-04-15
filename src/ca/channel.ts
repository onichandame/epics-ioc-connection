/* eslint-disable @typescript-eslint/camelcase */
import { types, writeCString, readCString, reinterpret } from 'ref'
import ArrayType from 'ref-array'
import { join } from 'path'
import { Library } from 'ffi'

import { EpicsType, nativeType } from './enum'

let LIBCA_PATH = process.env.NODE_EPICS_LIBCA
if (!LIBCA_PATH) {
  if (process.env.EPICS_BASE && process.env.EPICS_HOST_ARCH) {
    LIBCA_PATH = join(process.env.EPICS_BASE, 'lib', process.env.EPICS_HOST_ARCH, 'libca')
  }
}
if (!LIBCA_PATH) {
  throw new Error('cannot find epics base installation')
}

const MAX_STRING_SIZE = 40
const pendDelay = 1.e-5

const chanId = types.long
const evid = types.long
const chtype = types.long

const libca = Library(LIBCA_PATH, {
  ca_message: ['string', ['int']],
  ca_context_create: ['int', ['int']],
  ca_current_context: ['int', []],
  ca_pend_event: ['int', ['float']],
  ca_pend_io: ['int', ['float']],
  ca_test_io: ['int', []],
  ca_create_channel: ['int', ['string', 'pointer', 'pointer', 'int', 'pointer']],
  ca_host_name: ['string', ['long']],
  ca_field_type: ['short', ['long']],
  ca_state: ['short', [chanId]],
  ca_element_count: ['int', ['long']],
  ca_name: ['string', ['long']],
  ca_array_get: ['int', ['int', 'ulong', chanId, 'pointer']],
  ca_array_get_callback: ['int', ['int', 'ulong', chanId, 'pointer', 'pointer']],
  ca_array_put_callback: ['int', [chtype, 'ulong', chanId, 'pointer',
    'pointer', 'pointer']],
  ca_create_subscription: ['int', ['int', 'ulong', chanId, 'long', 'pointer', 'pointer', 'pointer']],
  ca_clear_subscription: ['int', [evid]],
  ca_clear_channel: ['int', [chanId]]
})

const getContext = (): number => libca.ca_context_create(1)

const context = getContext()

const message = (code: number): string => libca.ca_message(code)

const pend = (): void => {
  libca.ca_pend_event(pendDelay)
  libca.ca_pend_io(pendDelay)
}

const stringArrayToBuffer = (array: string[]): Buffer => {
  const count = array.length
  const buf = Buffer.alloc(count * MAX_STRING_SIZE)
  for (let i = 0; i < count; i += 1) {
    writeCString(buf, i * MAX_STRING_SIZE, array[i])
  }
  return buf
}

const coerceBufferToNativeType = (buf: Buffer, dbrType: EpicsType, count: number) => {
  const result: string[] = []
  if (dbrType === 'STRING') {
    const bufRef = reinterpret(buf, count * MAX_STRING_SIZE)
    for (let i = 0; i < count; i++) {
      result.push(readCString(bufRef, i * MAX_STRING_SIZE))
    }
  } else {
    const GetArrayType = ArrayType(types[nativeType[dbrType]])
    var array = new GetArrayType(buf)
    array.length = count
    array = array.toArray()
  }
  if (count === 1) {
    return array[0]
  } else {
    return array
  }
}

export class Channel {
  constructor (private pvname: string) {}
  public async connect (): Promise<void> {
    const chidPtr = Buffer.alloc(chanId.size)
    chidPtr.writeBigInt64LE(0 as bigint, 0)
    chidPtr.type = chanId
  }

  public async get (): Promise<string> {
  }

  public async put (value: string): Promise<void> {
  }
}
