import { Channel } from "./channel"

const testPvName = process.env.EPICS_TEST_PVNAME || "root:aoExample"
const timeout = 1000

describe("channel", () => {
  let ec: Channel
  beforeAll(async done => {
    ec = new Channel(testPvName)
    await ec.connect({ timeout })
    done()
  })
  test(`Connection to ${testPvName} can be established`, () => {
    expect(ec.isConnected()).toBeTruthy()
  })
  afterAll(() => {
    ec.disconnect()
  })
})
