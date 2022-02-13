/**
 * 
 * Universal Typed Protocol (UTP.js)
 * Compatible with Node.js & Browser
 * Copyright 2022 UnTalk Network Team
 * 
 */


import { decode } from './src/decode.js'
import { encode } from './src/encode.js'
import { setLock, setVersion, getVersion } from './src/update.js'
import { addSchema, addSchemes } from './src/update.js'
import { registerRPC, encodeRPC } from './src/rpc.js'
 
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