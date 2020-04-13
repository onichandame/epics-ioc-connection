export const ConState = {
  CS_NEVER_CONN: 0,
  CS_PREV_CONN: 1,
  CS_CONN: 2,
  CS_CLOSED: 3
}
export const state = {
  ECA_NORMAL: 1,
  ECA_TIMEOUT: 80,
  ECA_IODONE: 339,
  ECA_ISATTACHED: 424,
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
export type EpicsType =
  | 'STRING'
  | 'INT'
  | 'SHORT'
  | 'FLOAT'
  | 'ENUM'
  | 'CHAR'
  | 'LONG'
  | 'DOUBLE'
  | 'TIME_STRING'
  | 'TIME_INT'
  | 'TIME_SHORT'
  | 'TIME_FLOAT'
  | 'TIME_ENUM'
  | 'TIME_CHAR'
  | 'TIME_LONG'
  | 'TIME_DOUBLE'
  | 'CTRL_STRING'
  | 'CTRL_INT'
  | 'CTRL_SHORT'
  | 'CTRL_FLOAT'
  | 'CTRL_ENUM'
  | 'CTRL_CHAR'
  | 'CTRL_LONG'
  | 'CTRL_DOUBLE'

export const nativeType = [
  'CString',
  'int',
  'float',
  'int',
  'char',
  'int',
  'double'
]
