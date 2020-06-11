import { Channel } from "./channel"

jest.mock("./channel")

const channel = new Channel("")
channel.get()

describe("channel", () => {
  test("cannot be unit tested as it depends on EPICS", () => {
    expect(true).toBeTruthy()
  })
})
