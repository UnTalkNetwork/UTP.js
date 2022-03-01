import DEFS from './defs.js'
import ErrorsCodes from './errors.js'
import { pack, packString } from './tools.js'

let packetIndex = 0

/**
 * @param {string} schema - Schema name, default: PROTO
 * @param {object} data - Data to encoding, default: protocol definitions
 * @returns {Uint8Array}
 */
export function encode(schema = 'PROTO', data) {
  if (schema === 'PROTO') {
    data = data || DEFS
  }

  // check schema name
  const schemaIndex = DEFS.SCHEMES_NAMES.indexOf(schema)
  if (schemaIndex < 0) {
    throw new ReferenceError(`${ErrorsCodes.SCHEMA_NOT_FOUND}: Schema "${schema}" not found`)
  }

  packetIndex++
  if (packetIndex > 55555) {
    packetIndex = 0
  }

  // PING {schemaIndex: 0}
  // PONG {schemaIndex: 1}
  if (schemaIndex < 2) {
    // check packetIndex for PONG
    if (schemaIndex === 1 && (data === undefined || data.packetIndex === undefined || !Number.isInteger(data.packetIndex))) {
      throw new ReferenceError(`${ErrorsCodes.EMPTY_REQUIRED_FIELD}: Field "packetIndex" must be filled (UINT16)`)
    }
    
    // build packet
    let packet = new ArrayBuffer(4)
    let view = new DataView(packet)
    view.setUint16(0, schemaIndex)
    view.setUint16(2, schemaIndex === 0 ? packetIndex : data.packetIndex)
    return packet
  }

  // missing or empty data
  if (data === undefined) {
    data = {}
  }

  // encode data
  const encoded = encodeData(DEFS.SCHEMES[schemaIndex], data)
  let totalLength = 0
  for (let i = 0; i < encoded.length; i++) {
    totalLength += encoded[i].byteLength
  }
  let encodedData = new Uint8Array(totalLength)
  let offset = 0
  for (let i = 0; i < encoded.length; i++) {
    encodedData.set(new Uint8Array(encoded[i]), offset)
    offset += encoded[i].byteLength
  }

  // crate packet
  const size = DEFS.HEADER_SIZE + encodedData.length
  const packet = new Uint8Array(size)
  
  // add data to packet
  packet.set(encodedData, DEFS.HEADER_SIZE)
  let view = new DataView(packet.buffer)
  
  // add header to packet
  view.setUint16(0, schemaIndex)
  view.setUint16(2, packetIndex)
  view.setUint16(4, DEFS.VERSION)
  view.setUint32(6, size)
  return packet
}

/**
 * @param {string} schema - Schema name
 * @param {object} data - Data to encoding
 */
function encodeData(schema, data) {
  if (!Array.isArray(schema)) {
    throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA}: Invalid schema data`)
  }
  let result = []
  for (let i = 0; i < schema.length; i++) {
    result = result.concat(encodeDataField(schema[i], data))
  }
  return result
}

/**
 * Encode data field
 * @param {object} field 
 * @param {any} data
 * @returns 
 */
function encodeDataField(field, data) {
  let result = []
  let str
  let size
  let filled
  let fieldData = data[field.name]
  
  // incorrect data value
  if (fieldData === null || Number.isNaN(fieldData)) {
    fieldData = undefined
  }

  try {
    filled = fieldData !== undefined
    if (field.optional) {
      result = result.concat(pack(filled ? 1 : 0, DEFS.TYPES.INT8))

      // if null and optional
      if (fieldData === null) {
        return result
      }
    }
    if (filled) {
      switch (field.type) {
        case 'BOOL':
          if (typeof (fieldData) !== 'boolean') {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_TYPE}: Invalid data type (${field.type})`)
          }
          result = result.concat(pack(fieldData === false ? 0 : 1, DEFS.TYPES.BOOL))
          break
        case 'UINT8':
        case 'UINT16':
        case 'UINT32':
        case 'INT8':
        case 'INT16':
        case 'INT32':
        case 'INT64':
        case 'DATE':
          if (typeof (fieldData) !== 'number' || !isFinite(fieldData) || Math.floor(fieldData) !== fieldData) {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_TYPE}: Invalid data type "${field.type}" for field "${field.name}"`)
          }
          result = result.concat(pack(fieldData, DEFS.TYPES[field.type]))
          break
        case 'FLOAT':
          if (isNaN(fieldData)) {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_TYPE}: Invalid data type "${field.type}" for field "${field.name}"`)
          }
          result = result.concat(pack(fieldData, DEFS.TYPES[field.type]))
          break
        case 'ENUM':
          if (field.list !== undefined && Array.isArray(field.list) && field.list.indexOf(fieldData) > -1) {
            result = result.concat(pack(field.list.indexOf(fieldData), DEFS.TYPES.UINT16))
          } else {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE}: Invalid ENUM value "${fieldData}" for field "${field.name}", list: ${field.list.join(', ')}`)
          }
          break
        case 'BINARY':
          if (typeof (fieldData) !== 'object') {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_TYPE}: Invalid data type "${field.type}" for field "${field.name}"`)
          }
          if (fieldData.byteLength > DEFS.MAX_UINT32) {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE}: Invalid data length, max ${DEFS.MAX_UINT32}`)
          }
          size = pack(fieldData.byteLength, DEFS.TYPES.UINT32)
          result = result.concat(size).concat(fieldData.buffer)
          break
        case 'ARRAY':
          if (field.items === undefined || field.items.type === undefined || fieldData === undefined || !Array.isArray(fieldData)) {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_TYPE}: Invalid data type "${field.type}" for field "${field.name}"`)
          }
          size = pack(fieldData.length, DEFS.TYPES.UINT32)
          result = result.concat(size)
          for (let i = 0; i < fieldData.length; i++) {
            if (field.items.type === 'ARRAY') {
              size = pack(fieldData[i].length, DEFS.TYPES.UINT32)
              result = result.concat(size)
              let fieldValue = {}
              for (let j = 0; j < fieldData[i].length; j++) {
                fieldValue[DEFS.TEMP_NAME] = fieldData[i][j]

                let fieldDefinition = {
                  name: DEFS.TEMP_NAME,
                  type: field.items.items.type
                }

                DEFS.SCHEMES[DEFS.INDEX.SCHEMA].forEach(f => {
                  if (f.name !== 'name' && f.name !== 'type') {
                    if (field.items.items[f.name]) {
                      fieldDefinition[f.name] = field.items.items[f.name]
                    }
                  }
                })

                result = result.concat(encodeDataField(fieldDefinition, fieldValue))
              }
            } else {
              let fieldValue = {}
              fieldValue[DEFS.TEMP_NAME] = fieldData[i]

              let fieldDefinition = {
                name: DEFS.TEMP_NAME,
                type: field.items.type
              }

              DEFS.SCHEMES[DEFS.INDEX.SCHEMA].forEach(f => {
                if (f.name !== 'name' && f.name !== 'type') {
                  if (field.items[f.name]) {
                    fieldDefinition[f.name] = field.items[f.name]
                  }
                }
              })

              result = result.concat(encodeDataField(fieldDefinition, fieldValue))
            }
          }
          break
        case 'STRING':
        case 'JSON':
          if (
            (field.type === 'JSON' && typeof (fieldData) !== 'object')
            || (field.type === 'STRING' && typeof (fieldData) !== 'string')
          ) {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_TYPE}: Invalid data type (${field.type}) for field "${field.name}"`)
          }
          str = packString(field.type === 'JSON' ? JSON.stringify(fieldData) : fieldData)
          if (str.byteLength > DEFS.MAX_UINT32) {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE}: Invalid data length, max ${DEFS.MAX_UINT32}`)
          }
          size = pack(str.byteLength, DEFS.TYPES.UINT32)
          result = result.concat(size).concat(str)
          break
        case 'SCHEMA':
        case 'PACKET':
          if (typeof (fieldData) !== 'object') {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_TYPE}: Invalid data type (${field.type}) for field "${field.name}"`)
          }

          const schemaIndex = DEFS.INDEX[field.type === 'SCHEMA' ? field.schema : fieldData.schema]
          if (schemaIndex === undefined) {
            throw new ReferenceError(`${ErrorsCodes.SCHEMA_NOT_FOUND}: Schema "${fieldData.schema}" not found`)
          }

          // write schemaIndex for PACKET only
          if (field.type === 'PACKET') {
            result = result.concat(pack(schemaIndex, DEFS.TYPES.UINT16))
          }

          const schemaData = field.type === 'SCHEMA' ? data[field.name] : fieldData.data

          result = result.concat(encodeData(DEFS.SCHEMES[schemaIndex], schemaData))
          break
        default:
          throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA}: Undefinned field type "${field.type}"`)
      }
    } else if (!field.optional) {
      throw new ReferenceError(`${ErrorsCodes.EMPTY_REQUIRED_FIELD}: Field "${field.name}" is required and must be filled`)
    }
  } catch (err) {
    throw new Error(`${ErrorsCodes.PACK_ERROR}: Field "${field.name}" encoding error ${err.message}`)
  }

  return result
}
