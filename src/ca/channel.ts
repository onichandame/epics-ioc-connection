/* eslint-disable @typescript-eslint/camelcase */
import {
  alloc,
  deref,
  refType,
  types,
  writeCString,
  readCString,
  reinterpret,
} from "ref-napi"
import Struct from "ref-struct-napi"
import { Library, Callback } from "ffi-napi"
import { EventEmitter } from "events"
import { join } from "path"

import { ConError, DepError, GetError, PutError } from "./error"
import {
  Mask,
  DataType,
  ConState,
  CommonState,
  State,
  CAConState,
  ContextReturnState,
  PendIoReturnState,
  PendEventReturnState,
  CreateChannelReturnState,
  ClearSubscriptionReturnState,
  CreateSubscriptionReturnState,
  GetReturnState,
  ClearChannelState,
} from "./enum"

type CallbackArgs = {
  usr: Buffer
  chid: number
  type: number
  count: number
  dbr: Buffer
  status: State
}

export type Value = number | string | Array<number | string>

// use local epics installation
let LIBCA_PATH = process.env.NODE_EPICS_LIBCA
if (!LIBCA_PATH) {
  if (process.env.EPICS_BASE && process.env.EPICS_HOST_ARCH) {
    LIBCA_PATH = join(
      process.env.EPICS_BASE,
      "lib",
      process.env.EPICS_HOST_ARCH,
      "libca"
    )
  }
}
// use shipped binary
if (!LIBCA_PATH) {
  if (process.platform.includes("linux")) {
    if (process.arch.includes("64")) {
      LIBCA_PATH = join(global.epicsRootPath, "clibs", "linux64", "libca")
    }
  }
}

if (!LIBCA_PATH) {
  throw DepError
}

const MAX_STRING_SIZE = 40
const pendDelay = 1e-5
const size_tPtr = refType(types.size_t)
// const dblPtr = refType(types.double)

const chanId = types.long
const evId = types.long
const chtype = types.long

const libca = Library(LIBCA_PATH, {
  ca_message: ["string", ["int"]],
  ca_context_create: ["int", ["int"]],
  ca_context_destroy: ["int", []],
  ca_current_context: ["int", []],
  ca_pend_event: ["int", ["float"]],
  ca_pend_io: ["int", ["float"]],
  ca_test_io: ["int", []],
  ca_create_channel: [
    "int",
    ["string", "pointer", "pointer", "int", "pointer"],
  ],
  ca_host_name: ["string", ["long"]],
  ca_field_type: ["short", ["long"]],
  ca_state: ["short", [chanId]],
  ca_element_count: ["int", ["long"]],
  ca_name: ["string", ["long"]],
  ca_array_get: ["int", ["int", "ulong", chanId, "pointer"]],
  ca_array_get_callback: [
    "int",
    ["int", "ulong", chanId, "pointer", "pointer"],
  ],
  ca_array_put_callback: [
    "int",
    [chtype, "ulong", chanId, "pointer", "pointer", "pointer"],
  ],
  ca_create_subscription: [
    "int",
    ["int", "ulong", chanId, "long", "pointer", "pointer", "pointer"],
  ],
  ca_clear_subscription: ["int", [evId]],
  ca_clear_channel: ["int", [chanId]],
})

const message = (code: State): string => libca.ca_message(code)

// create context here. need to destroy in the future versions
const getContext = (): ContextReturnState => libca.ca_context_create(1)

const ccCode = getContext()

if (ccCode !== CommonState.ECA_NORMAL) {
  throw new Error(message(ccCode))
}

const pend = (): void => {
  const eventCode: PendEventReturnState = libca.ca_pend_event(pendDelay)
  const ioCode: PendIoReturnState = libca.ca_pend_io(pendDelay)
  if (eventCode !== CommonState.ECA_TIMEOUT) {
    throw PutError
  } else if (ioCode !== CommonState.ECA_NORMAL) {
    throw GetError
  }
}

const stringArrayToBuffer = (raw: Value): Buffer => {
  const count = Array.isArray(raw) ? raw.length : 1
  const array: string[] = Array(count)
  if (Array.isArray(raw)) {
    raw.forEach((item, index) => {
      array[index] = item.toString()
    })
  } else {
    array[0] = raw.toString()
  }
  const buf = Buffer.alloc(count * MAX_STRING_SIZE)
  for (let i = 0; i < count; i += 1) {
    writeCString(buf, i * MAX_STRING_SIZE, array[i])
  }
  return buf
}

const evargs_t = Struct({
  usr: size_tPtr,
  chid: chanId,
  type: types.long,
  count: types.long,
  dbr: size_tPtr,
  status: types.int,
})

export interface Channel {
  on(event: "value", listener: (value: DataType) => void): this
}

export class Channel extends EventEmitter {
  private _count: number
  private _field_type: DataType
  private _monitor_event_id_ptr: Buffer | null
  private _monitor_callback_ptr: Buffer | undefined
  private _callback_ptrs: Buffer[]
  private _connection_state_change_ptr: Buffer | null
  private _chid: number | null

  constructor(private _pvname: string) {
    super()
    this._count = 0
    this._callback_ptrs = []
    this._chid = null
    this._monitor_event_id_ptr = null
    this._field_type = DataType.NO_ACCESS
    this._connection_state_change_ptr = null
  }

  private parseValue(buf: Buffer, type: DataType, count: number): Value {
    const raw: string[] = []
    const bufRef = reinterpret(buf, count * MAX_STRING_SIZE)
    for (let i = 0; i < count; i++) {
      raw.push(readCString(bufRef, i * MAX_STRING_SIZE))
    }
    let result: string[] | number[] = Array(raw.length)
    switch (type) {
      case DataType.NO_ACCESS:
        return []
      case DataType.INT:
      case DataType.ENUM:
      case DataType.SHORT:
        raw.forEach((item, index) => {
          result[index] = parseInt(item)
        })
        break
      case DataType.STRING:
      case DataType.CHAR:
      default:
        result = raw
    }
    if (count === 1) {
      return result[0]
    } else {
      return result
    }
  }

  public get state(): State {
    if (this._chid === null) {
      return ConState.CS_CLOSED
    }
    return libca.ca_state(this._chid)
  }

  public get connected(): boolean {
    return this.state === ConState.CS_CONN
  }

  public connect({ timeout = 2000 } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      const chidPtr: Buffer = Buffer.alloc(chanId.size)
      chidPtr.type = chanId
      chidPtr.writeBigInt64LE(BigInt(0), 0)

      let firstCallback = true
      const userDataPtr = null
      const priority = 0

      this._connection_state_change_ptr = new Callback(
        "void",
        ["pointer", "long"],
        (_: number, ev: CAConState) => {
          this._count = libca.ca_element_count(this._chid)
          this._field_type = libca.ca_field_type(this._chid)
          this.emit("connection", ev)
          if (firstCallback) {
            firstCallback = false
            if (this.connected) {
              resolve()
            } else {
              reject(ConError)
            }
          }
        }
      )
      const caCode: CreateChannelReturnState = libca.ca_create_channel(
        this._pvname,
        this._connection_state_change_ptr,
        userDataPtr,
        priority,
        chidPtr
      )
      pend()
      this._chid = deref(chidPtr)
      if (caCode !== CommonState.ECA_NORMAL) {
        firstCallback = false
        reject(ConError)
      }
      setTimeout(() => {
        if (this.state === ConState.CS_NEVER_CONN) {
          firstCallback = false
          reject(ConError)
        }
      }, timeout)
    })
  }

  // a deadlock is seen when calling ca_clear_subscription or ca_clear_channel. Have to wait for a short time to bypass it. Intuitively it seems like a race condition
  // currently do not know what affects this behaviour, have to read the source code of EPICS which is not easy to do
  // increase the timeout if a deadlock is seen.
  public disconnect({ timeout = 10 } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (this._monitor_event_id_ptr !== null) {
          const csCode: ClearSubscriptionReturnState = libca.ca_clear_subscription(
            deref(this._monitor_event_id_ptr)
          )
          pend()
          if (csCode !== CommonState.ECA_NORMAL) {
            reject(message(csCode))
          }
        }
        if (this._chid) {
          const ccCode: ClearChannelState = libca.ca_clear_channel(this._chid)
          pend()
          if (ccCode !== CommonState.ECA_NORMAL) {
            reject(new Error(message(ccCode)))
          }
        }
        this._chid = null
        resolve()
      }, timeout)
    })
  }

  public get({ type = this._field_type } = {}): Promise<Value> {
    return new Promise((resolve, reject) => {
      const getCallbackPtr = Callback(
        "void",
        [evargs_t],
        ({ status, dbr }: CallbackArgs) => {
          if (status !== CommonState.ECA_NORMAL) {
            return reject(new Error(message(status)))
          }
          resolve(this.parseValue(dbr, type, this._count))
          this._callback_ptrs.splice(
            this._callback_ptrs.indexOf(getCallbackPtr),
            1
          )
        }
      )
      this._callback_ptrs.push(getCallbackPtr)
      const usrArg = null
      const getCode: GetReturnState = libca.ca_array_get_callback(
        DataType.STRING,
        this._count,
        this._chid,
        getCallbackPtr,
        usrArg
      )
      if (getCode !== CommonState.ECA_NORMAL) {
        return reject(new Error(message(getCode)))
      }
      pend()
    })
  }

  public put(value: Value): Promise<void> {
    return new Promise((resolve, reject) => {
      const putCallbackPtr = Callback(
        "void",
        [evargs_t],
        ({ status }: CallbackArgs) => {
          if (status !== CommonState.ECA_NORMAL) {
            reject(PutError)
          } else {
            resolve()
          }
        }
      )
      const count = Array.isArray(value) ? value.length : 1
      const buf: Buffer = stringArrayToBuffer(value)
      const usrArg = null
      const apCode = libca.ca_array_put_callback(
        DataType.STRING,
        count,
        this._chid,
        buf,
        putCallbackPtr,
        usrArg
      )
      if (apCode !== CommonState.ECA_NORMAL) {
        reject(PutError)
      }
      pend()
    })
  }

  public monitor({ type = this._field_type } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      this._monitor_event_id_ptr = alloc(types.size_t)
      this._monitor_callback_ptr = Callback(
        "void",
        [evargs_t],
        ({ dbr }: CallbackArgs) => {
          const value = this.parseValue(dbr, type, this._count)
          this.emit("value", value)
        }
      )
      const usrArg = null
      const csCode: CreateSubscriptionReturnState = libca.ca_create_subscription(
        DataType.STRING,
        this._count,
        this._chid,
        Mask.DBE_VALUE,
        this._monitor_callback_ptr,
        usrArg,
        this._monitor_event_id_ptr
      )
      if (csCode === CommonState.ECA_NORMAL) {
        resolve()
      } else {
        reject(new Error(message(csCode)))
      }
      pend()
    })
  }
}

export { DataType }
