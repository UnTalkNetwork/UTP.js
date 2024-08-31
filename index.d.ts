declare type UTPHeader = {
  packetIndex: number
  schemaIndex: number
  schemaName: string
  version: number
  size: number
  method?: string
}

declare type UTPPacket = {
  header: UTPHeader
  data: object
}

/**
 * Predefined types of field
 */
declare enum TYPE {
  BOOL = 'BOOL',
  UINT8 = 'UINT8',
  INT8 = 'INT8',
  UINT16 = 'UINT16',
  INT16 = 'INT16',
  UINT32 = 'UINT32',
  INT32 = 'INT32',
  INT64 = 'INT64',
  FLOAT = 'FLOAT',
  DATE = 'DATE',
  ENUM = 'ENUM',
  BINARY = 'BINARY',
  STRING = 'STRING',
  ARRAY = 'ARRAY',
  JSON = 'JSON',
  SCHEMA = 'SCHEMA',
  PACKET = 'PACKET',
}

/**
 * UTPPacketField
 *
 */
declare interface UTPPacketField {
  name: string
  type: TYPE
  optional?: boolean
  schema?: string
  list?: string[]
  items?: UTPPacketField
}

/**
 * Add user defined schema
 *
 * @param name Schema name
 * @param fields Array of UTPPacketField
 */

declare function addSchema(name: string, fields: UTPPacketField[]): void

/**
 * Decode binary to UTPPacket object
 *
 * @param data Binary data for decoding
 * @returns UTPPacket object
 *
 * ```js
 * import UTP from 'utp.js'
 * const packet = UTP.decode(data)
 * ```
 */
declare function decode(data: Uint8Array): UTPPacket

/**
 * Encode data of schema
 *
 * @param schema Name of schema. Default value 'PROTO'
 * @param data Object. Default protocol definitions
 * @returns Uint8Array data of UTPPacket
 *
 * ```js
 * const binary = UTP.encode('MySchema', { propery: value })
 * ```
 */
declare function encode(schema?: string, data?: object): Uint8Array

/**
 * Register RPC method and schema of argument
 *
 * @param method Name of RPC method
 * @param schema Shema name of RPC argument
 *
 * ```js
 * UTP.registerRPC('auth.getAccessToken', 'MySchema')
 * ```
 */
declare function registerRPC(method: string, schema: string): void

/**
 * Encode RPC packet
 *
 * @param method Name of RPC method
 * @param data Object for encode with schema of RPC method
 *
 * ```js
 * const binary = UTP.encodeRPC('auth.getAccessTocken', { propery: value })
 * ```
 */
declare function encodeRPC(method: string, data: object): Uint8Array

/**
 * Lock or unlock for automatic updates of protocol definitions
 *
 * @param isLocked Lock or unlock automatic update
 */
declare function setLock(isLocked: boolean): void

/**
 * Get lock or unlock status for automatic updates of protocol definitions
 *
 * @returns is locked
 */
declare function getLock(): boolean

/**
 * Set protocol definitions version number
 *
 * @param version New version number
 */
declare function setVersion(version: number): void

/**
 * Get protocol definitions version number
 *
 * @returns Version number of protocol definitions
 */
declare function getVersion(): number

/**
 * Get protocol definitions object
 *
 * @returns Protocol definitions object
 */
declare function getDefinitions(): object

export {
  TYPE,
  encode,
  decode,
  addSchema,
  registerRPC,
  encodeRPC,
  setLock,
  getLock,
  setVersion,
  getVersion,
  getDefinitions,
};