/* eslint-disable @typescript-eslint/camelcase */
import { deref, refType, types, readCString, reinterpret } from 'ref-napi'
import { ArrayType } from 'ref-array-napi'
import { Struct } from 'ref-struct-napi'
import { Library, Callback } from 'ffi-napi'
import { EventEmitter } from 'events'
import { join } from 'path'

import {
  ConError,
  DepError,
  GetError,
  PutError
} from './error'
import {
  EpicsType,
  FieldType,
  ConState,
  CommonState,
  State,
  // ContextReturnState,
  PendIoReturnState,
  PendEventReturnState,
  CreateChannelReturnState,
  ClearSubscriptionReturnState,
  GetReturnState
} from './enum'

type ConnectOption={
  timeout?: number;
}

type GetOption={
  fieldType?: FieldType;
}

type CallbackArgs={
  usr: Buffer;
  chid: number;
  type: number;
  count: number;
  dbr: Buffer;
  status: State;
}

let LIBCA_PATH = process.env.NODE_EPICS_LIBCA
if (!LIBCA_PATH) {
  if (process.env.EPICS_BASE && process.env.EPICS_HOST_ARCH) {
    LIBCA_PATH = join(process.env.EPICS_BASE, 'lib', process.env.EPICS_HOST_ARCH, 'libca')
  }
}
if (!LIBCA_PATH) {
  throw DepError
}

const MAX_STRING_SIZE = 40
const pendDelay = 1.e-5
const size_tPtr = refType(types.size_t)
// const dblPtr = refType(types.double)

const chanId = types.long
const evId = types.long
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
  ca_clear_subscription: ['int', [evId]],
  ca_clear_channel: ['int', [chanId]]
})

// const getContext = (): ContextReturnState => libca.ca_context_create(1) // may be messing threads here

// const context = getContext()

const message = (code: State): string => libca.ca_message(code)

const pend = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const eventCode: PendEventReturnState = libca.ca_pend_event(pendDelay)
    const ioCode: PendIoReturnState = libca.ca_pend_io(pendDelay)
    if (eventCode !== CommonState.ECA_TIMEOUT) {
      reject(PutError)
    } else if (ioCode !== CommonState.ECA_NORMAL) {
      reject(GetError)
    } else {
      resolve()
    }
  })
}

// const stringArrayToBuffer = (array: string[]): Buffer => {
//   const count = array.length
//   const buf = Buffer.alloc(count * MAX_STRING_SIZE)
//   for (let i = 0; i < count; i += 1) {
//     writeCString(buf, i * MAX_STRING_SIZE, array[i])
//   }
//   return buf
// }

const coerceBufferToStringOrArray = (buf: Buffer, dbrType: EpicsType, count: number): Array<string> | string => {
  let result: string[] = []
  if (dbrType === EpicsType.STRING) {
    const bufRef = reinterpret(buf, count * MAX_STRING_SIZE)
    for (let i = 0; i < count; i++) {
      result.push(readCString(bufRef, i * MAX_STRING_SIZE))
    }
  } else {
    const GetArrayType = ArrayType<string>('CString')
    const array = new GetArrayType(buf)
    result.length = count
    result = array.toArray()
  }
  if (count === 1) {
    return result[0]
  } else {
    return result
  }
}

const evargs_t = Struct({
  usr: size_tPtr,
  chid: chanId,
  type: types.long,
  count: types.long,
  dbr: size_tPtr,
  status: types.int
})

export class Channel extends EventEmitter {
  private _field_type: FieldType
  private _count: number
  //  private _monitor_callback_ptr: Callback | undefined
  private _monitor_event_id_ptr: Buffer | undefined
  private _callback_ptrs: Buffer[]
  private _connection_state_change_ptr: Buffer| undefined
  private _chid: number|null

  constructor (private _pvname: string) {
    super()
    this._field_type = FieldType.DBF_NO_ACCESS
    this._count = 0
    this._callback_ptrs = []
    this._chid = null
  }

  public get state (): State {
    if (typeof this._chid === 'undefined') {
      return ConState.CS_CLOSED
    }
    return libca.ca_state(this._chid)
  }

  public get connected (): boolean {
    return this.state === ConState.CS_CONN
  }

  public async connect ({ timeout = 2000 }: ConnectOption): Promise<void> {
    const chidPtr = Buffer.alloc(chanId.size)
    chidPtr.writeBigInt64LE(BigInt(0), 0)
    // (chidPtr as any).type = chanId

    let firstCallback = true
    const userDataPtr = null
    const priority = 0

    this._connection_state_change_ptr = new Callback('void', ['pointer', 'long'], (_: number, ev: number) => {
      this._field_type = libca.ca_field_type(this._chid)
      this._count = libca.ca_element_count(this._chid)
      this.emit('connection', ev)
      if (firstCallback) {
        firstCallback = false
        if (this.state !== ConState.CS_CONN) {
          throw ConError
        }
      }
      return 0
    })
    const caCode: CreateChannelReturnState = libca.ca_create_channel(this._pvname, this._connection_state_change_ptr, userDataPtr, priority, chidPtr)
    await pend()
    this._chid = deref(chidPtr)
    if (caCode !== CommonState.ECA_NORMAL) {
      firstCallback = false
      throw ConError
    }
    setTimeout(() => {
      if (this.state === ConState.CS_NEVER_CONN) {
        firstCallback = false
        throw ConError
      }
    }, timeout)
  }

  public async disconnect (): Promise<void> {
    if (typeof this._monitor_event_id_ptr !== 'undefined') {
      const csCode: ClearSubscriptionReturnState = libca.ca_clear_subscription(deref(this._monitor_event_id_ptr))
      await pend()
      if (csCode !== CommonState.ECA_NORMAL) {
        throw message(csCode)
      }
    }
    this._chid = null
  }

  public get ({ fieldType = this._field_type }: GetOption): Promise<string|string[]> {
    return new Promise((resolve, reject) => {
      const getCallbackPtr = Callback('void', [evargs_t], ({ status, dbr, type }: CallbackArgs) => {
        if (status !== CommonState.ECA_NORMAL) {
          return reject(new Error(message(status)))
        }
        const value = coerceBufferToStringOrArray(dbr, type, this._count)
        resolve(value)
        this._callback_ptrs.splice(this._callback_ptrs.indexOf(getCallbackPtr), 1)
      })
      this._callback_ptrs.push(getCallbackPtr)
      const usrArg = null
      const getCode: GetReturnState = libca.ca_array_get_callback(fieldType, this._count, this._chid, getCallbackPtr, usrArg)
      if (getCode !== CommonState.ECA_NORMAL) {
        return reject(new Error(message(getCode)))
      }
    })
  }
}
