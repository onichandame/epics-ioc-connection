import { types } from 'ref-napi'
// state code
export enum State{
ECA_NORMAL = 1,
ECA_TIMEOUT = 80,
ECA_ALLOCMEM = 48,
ECA_NOTTHREADED = 458,
ECA_EVDISALLOW = 210,
}

// state codes used by individual functions
export type ContextReturnState = State.ECA_NORMAL | State.ECA_ALLOCMEM | State.ECA_NOTTHREADED
export type PendIoReturnState = State.ECA_NORMAL | State.ECA_TIMEOUT | State.ECA_EVDISALLOW
export type PendEventReturnState = State.ECA_TIMEOUT | State.ECA_EVDISALLOW

export const ReturnState = {
  ECA_IODONE: 339,
  ECA_ISATTACHED: 424
}
export const ConState = {
  CS_NEVER_CONN: 0,
  CS_PREV_CONN: 1,
  CS_CONN: 2,
  CS_CLOSED: 3
}
export const state = {
  OP_CONN_UP: 6,
  OP_CONN_DOWN: 7,
  CS_NEVER_CONN: 0,
  CS_PREV_CONN: 1,
  CS_CONN: 2,
  CS_CLOSED: 3,
  CS_NEVER_SEARCH: 4
}
export const mask = {
  DBE_VALUE: 1,
  DBE_LOG: 2,
  DBE_ALARM: 4,
  DBE_PROPERTY: 8
}
export enum EpicsType {
  STRING,
  INT,
  SHORT,
  FLOAT,
  ENUM,
  CHAR,
  LONG,
  DOUBLE,
  TIME_STRING,
  TIME_INT,
  TIME_SHORT,
  TIME_FLOAT,
  TIME_ENUM,
  TIME_CHAR,
  TIME_LONG,
  TIME_DOUBLE,
  CTRL_STRING,
  CTRL_INT,
  CTRL_SHORT,
  CTRL_FLOAT,
  CTRL_ENUM,
  CTRL_CHAR,
  CTRL_LONG,
  CTRL_DOUBLE,
}

export enum NativeType {
  CString,
  float,
  char,
  int,
  double,
}

export const nativeTypeToString = (ntype: NativeType): keyof typeof types => {
  switch (ntype) {
    case NativeType.CString:
      return 'CString'
    case NativeType.float:
      return 'float'
    case NativeType.char:
      return 'char'
    case NativeType.int:
      return 'int'
    case NativeType.double:
      return 'double'
    default:
      return 'CString'
  }
}

export const epicsTypeToNativeType = (etype: EpicsType): NativeType => {
  switch (etype) {
    case EpicsType.STRING:
      return NativeType.CString
    case EpicsType.LONG:
    case EpicsType.ENUM:
    case EpicsType.INT:
    case EpicsType.SHORT:
      return NativeType.int
    case EpicsType.FLOAT:
      return NativeType.float
    case EpicsType.CHAR:
      return NativeType.char
    case EpicsType.DOUBLE:
      return NativeType.double
    default:
      return NativeType.CString
  }
}