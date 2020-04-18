export const MockChannel = jest.fn()
export const MockConnect = jest.fn().mockImplementation(() => Promise.resolve(MockChannel))
export const MockDisconnect = jest.fn().mockImplementation(() => Promise.resolve())
export const MockGet = jest.fn().mockImplementation(() => Promise.resolve())
export const MockPut = jest.fn().mockImplementation(() => Promise.resolve())
export const MockMonitor = jest.fn().mockImplementation(() => Promise.resolve())

export const Channel = jest.fn().mockImplementation(() => ({
  new: MockChannel,
  connect: MockConnect,
  disconnect: MockDisconnect,
  get: MockGet,
  put: MockPut,
  monitor: MockMonitor
}))
