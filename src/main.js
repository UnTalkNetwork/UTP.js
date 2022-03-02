import DEFS from './defs.js'
import { decode } from './decode.js'
import { encode } from './encode.js'
import { setLock, setVersion, getVersion } from './update.js'
import { addSchema, addSchemes, getDefinitions } from './update.js'
import { registerRPC, encodeRPC } from './rpc.js'

const TYPE = {
  BOOL: 'BOOL',
  UINT8: 'UINT8',
  INT8: 'INT8',
  UINT16: 'UINT16',
  INT16: 'INT16',
  UINT32: 'UINT32',
  INT32: 'INT32',
  INT64: 'INT64',
  FLOAT: 'FLOAT',
  DATE: 'DATE',
  ENUM: 'ENUM',
  BINARY: 'BINARY',
  STRING: 'STRING',
  ARRAY: 'ARRAY',
  JSON: 'JSON',
  SCHEMA: 'SCHEMA',
  PACKET: 'PACKET',
}

export default {
  TYPE,
  encode,
  decode,
  addSchema,
  addSchemes,
  registerRPC,
  encodeRPC,
  setLock,
  setVersion,
  getVersion,
  getDefinitions,
}