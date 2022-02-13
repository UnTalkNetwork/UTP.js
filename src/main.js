import { decode } from './decode.js'
import { encode } from './encode.js'
import { setLock, setVersion, getVersion } from './update.js'
import { addSchema, addSchemes } from './update.js'
import { registerRPC, encodeRPC } from './rpc.js'

export default {
  encode,
  decode,
  addSchema,
  addSchemes,
  registerRPC,
  encodeRPC,
  setLock,
  setVersion,
  getVersion,
}