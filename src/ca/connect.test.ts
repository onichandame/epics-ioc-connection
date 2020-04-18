import { connect } from './connect'

jest.mock('./channel')

describe('connect', () => {
  test('connect without throw', async () => {
    return expect(connect('')).resolves.toBeTruthy()
  })
})
