const DEFS = {
  VERSION: 1,
  TYPES: {
    BOOL: { bits: 8 },
    UINT8: { bits: 8 },
    INT8: { bits: 8, signed: true },
    UINT16: { bits: 16 },
    INT16: { bits: 16, signed: true },
    UINT32: { bits: 32 },
    INT32: { bits: 32, signed: true },
    INT64: { bits: 64 },
    FLOAT: { bits: 64, float: true },
    DATE: { bits: 64 },             // timestamp with milliseconds
    ENUM: { bits: 16 },             // predefined lists
    BINARY: {},                     // binary data
    STRING: {},                     // multi-byte string (1-4 bytes)
    ARRAY: {},                      // typed array of all available types include array too
    JSON: {},                       // stored as string after tests
    SCHEMA: {},                     // array of fields
    PACKET: {}                      // { schema: schema name, data: packet of schema }
  },
  SCHEMES_NAMES: [
    'PING', 'PONG', 'HELLO', 'ERROR',
    'SCHEMA_ITEMS', 'SCHEMA', 'PROTO', 'RPC'
  ],
  TYPES_NAMES: [],
  SCHEMES: [],
  INDEX: {},
  RPC: [],
  SIZE_SIZE: 4,
  HEADER_SIZE: 10,
  TEMP_NAME: '__TEMP_NAME__',
  MAX_UINT32: 4294967295,
  IS_LOCKED: true,
  compile: () => {
    // create packets index
    DEFS.SCHEMES_NAMES.forEach((value, index) => DEFS.INDEX[value] = index)
  }
}

// create types names
for (let TYPE in DEFS.TYPES) {
  DEFS.TYPES_NAMES.push(TYPE)
}

// compile protocol indexes
DEFS.compile()

DEFS.SCHEMES[DEFS.INDEX.PING] = DEFS.SCHEMES[DEFS.INDEX.PONG] = DEFS.SCHEMES[DEFS.INDEX.HELLO] = []

DEFS.SCHEMES[DEFS.INDEX.ERROR] = [
  { name: 'code', type: 'UINT16' },
  { name: 'text', type: 'STRING' }
]

DEFS.SCHEMES[DEFS.INDEX.SCHEMA_ITEMS] = [
  { name: 'type', type: 'ENUM', list: DEFS.TYPES_NAMES },
  { name: 'schema', type: 'STRING', optional: true },
  { name: 'items', type: 'SCHEMA', schema: 'SCHEMA_ITEMS', optional: true },
  { name: 'list', type: 'ARRAY', items: { type: 'STRING' }, optional: true }
]

DEFS.SCHEMES[DEFS.INDEX.SCHEMA] = [
  { name: 'name', type: 'STRING' },
  { name: 'type', type: 'ENUM', list: DEFS.TYPES_NAMES },
  { name: 'items', type: 'SCHEMA', schema: 'SCHEMA_ITEMS', optional: true },
  { name: 'schema', type: 'STRING', optional: true },
  { name: 'list', type: 'ARRAY', items: { type: 'STRING' }, optional: true },
  { name: 'maxlength', type: 'INT32', optional: true },
  { name: 'optional', type: 'BOOL', optional: true }
]

DEFS.SCHEMES[DEFS.INDEX.PROTO] = [
  { name: 'VERSION', type: 'UINT32' },
  { name: 'TYPES', type: 'JSON' },
  { name: 'SCHEMES_NAMES', type: 'ARRAY', items: { type: 'STRING' } },
  { name: 'SCHEMES', type: 'ARRAY', items: { type: 'ARRAY', items: { type: 'SCHEMA', schema: 'SCHEMA' } } }
]

DEFS.SCHEMES[DEFS.INDEX.RPC] = [
  { name: 'method', type: 'STRING' },
  { name: 'packet', type: 'PACKET', optional: true }
]

export default DEFS