import { types, Type } from 'ref-napi'
// state code
export enum CommonState{
  ECA_NORMAL = 1,
  ECA_TIMEOUT = 80,
  ECA_ALLOCMEM = 48,
  ECA_NOTTHREADED = 458,
  ECA_EVDISALLOW = 210,
  ECA_BADTYPE=114,
  ECA_STRTOBIG=96,
  ECA_BADCHID=410,
  ECA_BADCOUNT=196,
  ECA_GETFAIL=152,
  ECA_NORDACCESS=368,
  ECA_DISCONN=192
}

// state codes returned by individual functions
export type ContextReturnState =
  | CommonState.ECA_NORMAL
  | CommonState.ECA_ALLOCMEM
  | CommonState.ECA_NOTTHREADED
export type PendIoReturnState =
  | CommonState.ECA_NORMAL
  | CommonState.ECA_TIMEOUT
  | CommonState.ECA_EVDISALLOW
export type PendEventReturnState =
  | CommonState.ECA_TIMEOUT
  | CommonState.ECA_EVDISALLOW
export type CreateChannelReturnState =
  | CommonState.ECA_NORMAL
  | CommonState.ECA_BADTYPE
  | CommonState.ECA_STRTOBIG
  | CommonState.ECA_ALLOCMEM
export type ClearSubscriptionReturnState=
  | CommonState.ECA_NORMAL
  | CommonState.ECA_BADCHID
export type GetReturnState=
  | CommonState.ECA_NORMAL
  | CommonState.ECA_BADTYPE
  | CommonState.ECA_BADCHID
  | CommonState.ECA_BADCOUNT
  | CommonState.ECA_GETFAIL
  | CommonState.ECA_NORDACCESS
  | CommonState.ECA_ALLOCMEM
  | CommonState.ECA_DISCONN
export type ClearChannelState=
  | CommonState.ECA_NORMAL
  | CommonState.ECA_BADCHID

export enum ConState {
  CS_NEVER_CONN,
  CS_PREV_CONN,
  CS_CONN,
  CS_CLOSED
}

export enum CAConState{
  CA_OP_CONN_UP=6,
  CA_OP_CONN_DOWN=7
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

export enum FieldType{
  DBF_STRING,
  DBF_INT,
  DBF_SHORT,
  DBF_FLOAT,
  DBF_ENUM,
  DBF_CHAR,
  DBF_LONG,
  DBF_DOUBLE,
  DBF_NO_ACCESS,
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

export const epicsTypeToRefType = (etype: EpicsType): Type => {
  switch (etype) {
    case EpicsType.STRING:
      return types.CString
    case EpicsType.LONG:
    case EpicsType.ENUM:
    case EpicsType.INT:
    case EpicsType.SHORT:
      return types.int
    case EpicsType.FLOAT:
      return types.float
    case EpicsType.CHAR:
      return types.char
    case EpicsType.DOUBLE:
      return types.double
    default:
      return types.CString
  }
}
export type State=number
