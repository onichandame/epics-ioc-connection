import { dirname } from "path"

declare global {
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace NodeJS {
    interface Global {
      epicsRootPath: string
    }
  }
}

global.epicsRootPath = dirname(__dirname)
process.env.PATH += `:${global.epicsRootPath}`
