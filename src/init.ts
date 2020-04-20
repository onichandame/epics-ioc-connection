import { dirname } from 'path'

declare global{
  /* eslint-disable-next-line @typescript-eslint/no-namespace */
  namespace NodeJS{
    interface Global {
      rootPath: string;
    }
  }
}

global.rootPath = dirname(__dirname)
process.env.PATH = process.env.PATH + `:${global.rootPath}`
console.log(global.rootPath)
