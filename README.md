<p align="center">
  <h1 align="center">UTP.js</h1>
</p>

**UTP.js** is simple, fast and lightweight binary typed protocol for Node.js and Browser with zero dependencies and built-in RPC

## Quick Start

**1. Install**

```bash
npm install utp.js
```

or

```bash
yarn add utp.js
```

**2. Add user defined scheme**

```js
import UTP from 'utp.js'

UTP.addSchema('MY_DATA', [
  { name: 'id', type: UTP.TYPE.UINT32 },
  { name: 'name', type: UTP.TYPE.STRING },
  { name: 'type', type: UTP.TYPE.ENUM, list: ['ONE', 'TWO', 'THREE'] },
  { name: 'rights', type: UTP.TYPE.ARRAY, items: { type: UTP.TYPE.UINT8 } },
  { name: 'active', type: UTP.TYPE.BOOL }
])

```

**3. Encode data to binary packet**

```js
const data = UTP.encode('MY_DATA', {
  id: 4512,
  name: 'Username',
  type: 'ONE',
  rights: [1, 2, 3],
  active: true
})
```

**4. Decode data to JavaScript object**
```js
const packet = UTP.decode(data)
console.log('Decoded header', packet.header)
console.log('Decoded data', packet.data)

/**
 * 
 * Output
 * Decoded header {
 *   schemaIndex: 8,
 *   packetIndex: 1,
 *   version: 1,
 *   size: 36,
 *   schemaName: 'MY_DATA'
 * }
 * Decoded data {
 *   id: 4512,
 *   name: 'Username',
 *   type: 'ONE',
 *   rights: [ 1, 2, 3 ],
 *   active: true
 * }
 */
```

**5. Register RPC method**

```js
UTP.addSchema('AUTH_SIGNIN', [
  { name: 'email', type: UTP.TYPE.STRING }
])

UTP.registerRPC('auth.getCode', 'AUTH_SIGNIN')
```

**6. Encode RPC data to binary packet**

```js
const data = UTP.encodeRPC('auth.getCode', {
  email
})
```

**7. Decode RPC data**

```js
const packet = UTP.decode(data)
console.log('Decoded header', packet.header)
console.log('Decoded data', packet.data)

/**
 * Output
 * Decoded header {
 *   schemaIndex: 7,
 *   packetIndex: 1,
 *   version: 1,
 *   size: 51,
 *   schemaName: 'RPC',
 *   method: 'auth.getCode'
 * }
 * Decoded data { email: 'test@email.address' }
 */
```

**8. Update protocol definitions on client**

```js

// .... you have added new RPC schemas or methods to the server

UTP.setVersion(10000)

// PROTO is default schema for encode
const defs = UTP.encode()

// on the client the protocol definitions have an automatic update after unlocking and decoding the PROTO packet
UTP.setLock(false)
UTP.decode(defs)

UTP.getVersion() // 10000
```


## Predefined schemes

### HELLO/PING/PONG
```js
[]
```

### ERROR
```js
[
  { name: 'code', type: UTP.TYPE.UINT16 },
  { name: 'text', type: UTP.TYPE.STRING }
]
```

### PROTO
```js
[
  { name: 'VERSION', type: UTP.TYPE.UINT32 },
  { name: 'TYPES', type: UTP.TYPE.JSON },
  { name: 'SCHEMES_NAMES', type: UTP.TYPE.ARRAY, items: { type: UTP.TYPE.STRING } },
  { name: 'SCHEMES', type: UTP.TYPE.ARRAY, items: { type: UTP.TYPE.ARRAY, items: { type: UTP.TYPE.SCHEMA, schema: 'SCHEMA' } } },
  { name: 'RPC', type: 'JSON' }
]
```

### SCHEMA
```js
[
  { name: 'name', type: UTP.TYPE.STRING },
  { name: 'type', type: UTP.TYPE.ENUM, list: DEFS.TYPES_NAMES },
  { name: 'items', type: UTP.TYPE.SCHEMA, schema: 'SCHEMA_ITEMS', optional: true },
  { name: 'schema', type: UTP.TYPE.STRING, optional: true },
  { name: 'list', type: UTP.TYPE.ARRAY, items: { type: UTP.TYPE.STRING }, optional: true },
  { name: 'maxlength', type: UTP.TYPE.INT32, optional: true },
  { name: 'optional', type: UTP.TYPE.BOOL, optional: true }
]
```

### SCHEMA_ITEMS
```js
[
  { name: 'type', type: UTP.TYPE.ENUM, list: DEFS.TYPES_NAMES },
  { name: 'schema', type: UTP.TYPE.STRING, optional: true },
  { name: 'items', type: UTP.TYPE.SCHEMA, schema: 'SCHEMA_ITEMS', optional: true },
  { name: 'list', type: UTP.TYPE.ARRAY, items: { type: UTP.TYPE.STRING }, optional: true }
]
```

### RPC
```js
[
  { name: 'method', type: UTP.TYPE.STRING },
  { name: 'packet', type: UTP.TYPE.PACKET, optional: true }
]
```

## Predefined types

### Basic types

| Type | Bytes | Min | Max |
|------|-------|-----|-----|
|BOOL  | 1     |0|255|
|INT8  | 1     |-128|127|
|UINT8 | 1     |0|255|
|INT16 | 2     |-32,768|32,767|
|UINT16| 2     |0|65,535|
|INT32 | 4     |-2,147,483,648|2,147,483,647|
|UINT32| 4     |0|4,294,967,295|
|INT64 | 8     |-9,007,199,254,740,991|9,007,199,254,740,991|
|FLOAT | 8     |-9,007,199,254,740,991|9,007,199,254,740,991|
|DATE  | 8     |0|8,640,000,000,000,000|

### Additional types

| Type | Max length |
|------|------------|
|ENUM  | UINT16     |
|BINARY| UINT32     |
|STRING| UINT32     |
|ARRAY | UINT32     |
|JSON  | UINT32 (after stringify)    |

### Extended types

| Type | Description |
|------|-------------|
|SCHEMA| Used for nested schemes |
|PACKET| Used for separate schema object in packet, required fields `schema` and `data` |



---

## License

- See [LICENSE](/LICENSE)

---