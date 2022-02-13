import DEFS from './defs.js'
import ErrorsCodes from './errors.js'
import { encode } from './encode.js'

/**
 * @param {string} method - RPC method name
 * @param {string} schema - Schema name
 * @returns {Uint8Array}
 */
export function registerRPC(method, schema) {
  if (DEFS.RPC[method] !== undefined) {
    throw new Error(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE} RPC method "${method}" already in use`)
  }

  if (DEFS.INDEX[schema] === undefined) {
    throw new Error(`${ErrorsCodes.SCHEMA_NOT_FOUND} Schema "${schema}" not found`)
  }

  DEFS.RPC[method] = schema
}

export function encodeRPC(method, data) {
  if (DEFS.RPC[method] === undefined) {
    throw new Error(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE} RPC method "${method}" not found`)
  }

  return encode('RPC', {
    method: method,
    packet: {
      schema: DEFS.RPC[method],
      data,
    }
  })
}