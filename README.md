# EPICS IOC Connection

Forked from [this repo](https://github.com/RobbieClarken/node-epics) but does not have the same signature with the original package.

This package aims to provide a convenient interface for JS/TS codes to communicate with the EPICS IOCs.

Shipped with types

# Author

[onichandame](https://github.com/onichandame)

# Guide

## Pre-requisite

You are assumed to be familiar with the EPICS framework. If not, check the official site and the [API docs](https://epics.anl.gov/base/R3-14/10-docs/CAref.html).

This package is not a traditional JS package which only depends on the JS runtime due to the complexity of the ChannelAccess protocol. It requires the following conditions being met:

1. an installation of epics base. The development of this package is based on EPICS 3.14.12.8
2. one of the below env variables set(Check the meaning of them in the official installation guide of EPICS). If none is installed, it will fallback to the binaries shipped in `clibs` directory, which will not be guaranteed to work in your environment.
    - LIBCA_PATH
    - EPICS_BASE and EPICS_HOST_ARCH

## Installation

```bash
yarn add epics-ioc-connection
# or
npm i epics-ioc-connection
```

## Usage

```typescript
import { CA } from 'epics-ioc-connection'

(async () => {
  // self-managed channel
  const channel = await CA.connect('rootHost:ai1')
    // get once
  channel.get()
    .then(value => console.log(value))
    // put once
    .then(channel.put(4))
    .then(() => console.log('pushed value to channel'))
    // get new value when value changes
    .then(channel.monitor)
    .then(() => {
      channel.on('value', value => console.log(value))
    })
    // disconnect
  setTimeout(channel.disconnect, 5000)

  // managed methods
    // get once
  console.log(await CA.get('rootHost:ai1'))
    // put once
  try {
    await CA.put('rootHost:ai1', 3)
  } catch(e) {
    console.error(`put failed due to ${e}`)
  }
})()
```

# LICENSE

[MIT](https://opensource.org/licenses/MIT)

# Roadmap

- separate types of dependencies to DefinitelyTyped
- test caget/caput/camonitor
- implement ca using napi
- implement ca using pure ts
- write unit test(after previous)
