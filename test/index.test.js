import UTP from '../index.js'

test('Custom schema', () => {
  UTP.addSchema('TYPES_TEST', [
    { name: 'bool', type: 'BOOL' },
    { name: 'int8', type: 'INT8' },
    { name: 'int16', type: 'INT16' },
    { name: 'int32', type: 'INT32' },
    { name: 'uint8', type: 'UINT8' },
    { name: 'uint16', type: 'UINT16' },
    { name: 'uint32', type: 'UINT32' },
    { name: 'int64', type: 'INT64' },
    { name: 'int642', type: 'INT64' },
    { name: 'float64', type: 'FLOAT' },
    { name: 'date', type: 'DATE' },
    { name: 'dateMax', type: 'DATE' },
    { name: 'optionalDate', type: 'DATE', optional: true },
    { name: 'string', type: 'STRING' },
    { name: 'optionalString', type: 'STRING', optional: true },
    { name: 'nestedArray', type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'SCHEMA', schema: 'ERROR' } } },
    { name: 'customObject', type: 'SCHEMA', schema: 'ERROR' },
    { name: 'arrayOfObjects', type: 'ARRAY', items: { type: 'SCHEMA', schema: 'ERROR' } },
    { name: 'enum', type: 'ENUM', list: ['enum1', 'enum2', 'enum3'], optional: true },
    { name: 'arrayOfInt', type: 'ARRAY', items: { type: 'INT8' } },
    { name: 'JSON', type: 'JSON' }
  ])

  const data = {
    bool: true,
    int8: 64,
    int16: -32000,
    int32: 2000000001,
    uint8: 64,
    uint16: 65000,
    uint32: 4024512000,
    int64: 1234567890123456,
    int642: -9007199254740991,
    float64: 1234567890123442.3242378512735,
    string: '1222',
    optionalString: 'text',
    date: Date.now(),
    dateMax: 8640000000000000,
    nestedArray: [
      [{
        code: 33,
        text: 'Test array of array'
      }, {
        code: 34,
        text: 'Test array of array'
      }, {
        code: 35,
        text: 'Test array of array'
      }],
      [{
        code: 53,
        text: 'Test array of array'
      }, {
        code: 53,
        text: 'Test array of array'
      }, {
        code: 53,
        text: 'Test array of array'
      }]
    ],
    customObject: {
      code: 121,
      text: 'Error text test four'
    },
    arrayOfObjects: [{
      code: 1,
      text: 'Record one'
    }, {
      code: 2,
      text: 'Record two'
    }, {
      code: 3,
      text: 'Record three'
    }, {
      code: 4,
      text: 'Record four'
    }],
    enum: 'enum2',
    arrayOfInt: [1, 2, 3, 4, 88],
    JSON: {
      a: 1,
      b: 'test',
      c: true
    }
  }
  const result = UTP.decode(UTP.encode('TYPES_TEST', data))
  expect(data).toEqual(result.data)
})

test('RPC', () => {
  UTP.addSchema('AUTH_SIGNIN', [
    { name: 'email', type: 'STRING' }
  ])
  
  UTP.registerRPC('auth.getCode', 'AUTH_SIGNIN')
  
  const data = { email: 'test@email.address' }
  const encoded = UTP.encodeRPC('auth.getCode', data)
  const decoded = UTP.decode(encoded)
  expect(decoded.data).toEqual(data)
})

test('Update', () => {

  // add new schemes and register new RPC methods
  UTP.addSchema('TEST', [
    { name: 'test', type: 'STRING' }
  ])
  UTP.registerRPC('test', 'TEST')

  // get protocol definitions (default schema PROTO)
  const { data: proto } = UTP.decode(UTP.encode())
  
  const oldVersion = UTP.getVersion()

  // update version
  proto.VERSION = 10000

  // encode new definitions (built-in schema PROTO)
  const encoded = UTP.encode('PROTO', proto)

  // on client unlock for updates
  UTP.setLock(false)
  
  // on decode packet with schema = PROTO and VERSION > current UTP run automatic update
  const decoded = UTP.decode(encoded)
  
  expect(UTP.decode(UTP.encode()).data.VERSION).toEqual(proto.VERSION)
})