import DEFS from './defs.js'
import ErrorsCodes from './errors.js'
import { unpack, unpackString } from './tools.js'
import { update } from './update.js'

/**
 * @param {Uint8Array} data - Data to decoding
 * @returns {object} Decoded object with header and data { header, data }
 */
export function decode(data) {
  if (data === undefined || typeof data !== 'object') {
    throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA}: Data is missing or not object`)
  }
  // HELLO PING PONG
  if (data.byteLength === 4) {
    const buffer = new Uint8Array(data)
    const schemaIndex = unpack(buffer.buffer, DEFS.TYPES.UINT16)
    return {
      header: {
        schemaIndex,
        packetIndex: unpack(buffer.buffer, DEFS.TYPES.UINT16, 2),
        schemaName: DEFS.SCHEMES_NAMES[schemaIndex],
      }
    }
  }
  
  const header = decodeHeader(data)
  
  if (header.size !== data.length) {
    throw new Error(`${ErrorsCodes.INCORRECT_PACKET_SIZE}: Incorrect packet size ${data.length}, in header ${header.size}`)
  }

  if (DEFS.SCHEMES_NAMES[header.schemaIndex] === undefined) {
    throw new ReferenceError(`${ErrorsCodes.SCHEMA_NOT_FOUND}: Invalid schema index (${header.schemaIndex}) in header, schema not found`)
  }
  
  // add schema name to header
  header.schemaName = DEFS.SCHEMES_NAMES[header.schemaIndex]

  const packet = { header }
  const decoded = decodeData(DEFS.SCHEMES[packet.header.schemaIndex], data)
  
  // automatic protocol update
  if (
    DEFS.SCHEMES_NAMES[header.schemaIndex] === 'PROTO'
    && !DEFS.IS_LOCKED
    && decoded.data.VERSION > DEFS.VERSION
  ) {
    update(decoded.data)
  }

  // add data
  if (header.schemaName === 'RPC') {
    if (DEFS.RPC[decoded.data.method] !== decoded.data.packet.schema) {
      throw new Error(`${ErrorsCodes.INVALID_RPC_INPUT_DATA}: Incorrect schema for RPC method "${decoded.data.method}"`)
    }
    packet.header.method = decoded.data.method
    packet.data = decoded.data.packet.packet 
  } else {
    packet.data = decoded.data
  }
  
  return packet
}

/**
 * @param {Uint8Array} data - Data to decoding
 */
function decodeHeader(data) {
  if (data.length < DEFS.HEADER_SIZE) {
    return new ReferenceError(`${ErrorsCodes.INCORRECT_PACKET_SIZE}: Incorrect header size (${DEFS.HEADER_SIZE})`)
  }
  let view = new DataView(data.buffer)
  try {
    return {
      schemaIndex: view.getUint16(0),
      packetIndex: view.getUint16(2),
      version: view.getUint16(4),
      size: view.getUint32(6),
    }
  } catch (err) {
    return new ReferenceError(`${ErrorsCodes.INVALID_HEADER}: Invalid header`)
  }
}

/**
 * @param {Array} schema - Schema name
 * @param {Uint8Array} binaryData - Data to decoding
 */
function decodeData(schema, binaryData, start) {
  if (binaryData === undefined) {
    return [{}]
  }

  let result = {}
  let offset = start || DEFS.HEADER_SIZE
  let fieldData
  for (let i = 0; i < schema.length; i++) {
    fieldData = decodeDataField(schema[i], binaryData, offset)
    if (fieldData[0] !== undefined) {
      result[schema[i].name] = fieldData[0]
    }
    offset = fieldData[1]
  }
  return { data: result, offset: offset }
}

function decodeDataField(field, binaryData, offset) {
  try {
    // if optional field check filled (1 byte) 1 - filled, 0 - skip
    if (field.optional) {
      let unpacked = unpack(binaryData.buffer, DEFS.TYPES.INT8, offset)
      if (unpacked === 0) {
        // skeep field
        offset += 1
        return [undefined, offset]
      }
      offset += 1
    }

    let result
    let size
    switch (field.type) {
      case 'BOOL':
      case 'UINT8':
      case 'UINT16':
      case 'UINT32':
      case 'INT8':
      case 'INT16':
      case 'INT32':
      case 'INT64':
      case 'DATE':
      case 'FLOAT':
      case 'ENUM':
        result = unpack(binaryData.buffer, DEFS.TYPES[field.type], offset)
        offset += parseInt(DEFS.TYPES[field.type].bits / 8)
        // convert to bool
        if (field.type === 'BOOL') {
          result = result !== 0
        }
        // enum
        if (field.type === 'ENUM') {
          if (field.list[result] === undefined) {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE}: Invalid ENUM value "${result}" for field "${field.name}", list: ${field.list.join(', ')}`)
          }
          result = field.list[result]
        }
        break
      case 'BINARY':
        size = unpack(binaryData.buffer, DEFS.TYPES.UINT32, offset)
        offset += DEFS.SIZE_SIZE
        result = Array.from(new Uint8Array(binaryData.subarray(offset, offset + size)))
        offset += size
        break
      case 'ARRAY':
        size = unpack(binaryData.buffer, DEFS.TYPES.UINT32, offset)
        offset += DEFS.SIZE_SIZE
        result = []
        let arrayItem
        for (let i = 0; i < size; i++) {
          if (field.items.type === 'ARRAY' && field.items.items !== undefined && field.items.items.type !== undefined) {
            let arraySize = unpack(binaryData.buffer, DEFS.TYPES.UINT32, offset)
            offset += DEFS.SIZE_SIZE

            let resultInArray = []
            for (let j = 0; j < arraySize; j++) {
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

              arrayItem = decodeDataField(fieldDefinition, binaryData, offset)
              resultInArray.push(arrayItem[0])
              offset = arrayItem[1]
            }
            result.push(resultInArray)
          } else {

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

            arrayItem = decodeDataField(fieldDefinition, binaryData, offset)
            result.push(arrayItem[0])
            offset = arrayItem[1]
          }
        }
        break
      case 'STRING':
      case 'JSON':
        size = unpack(binaryData.buffer, DEFS.TYPES.UINT32, offset)
        offset += DEFS.SIZE_SIZE
        result = unpackString(binaryData.subarray(offset, offset + size))
        offset += size

        // decode json
        if (field.type === 'JSON') {
          try {
            result = JSON.parse(result)
          } catch (err) {
            throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE}: Invalid JSON in field "${field.name}"`)
          }
        }
        break
      case 'SCHEMA':
      case 'PACKET':
        let schemaIndex = DEFS.INDEX[field.schema]
        // decode schemaIndex for PACKET only
        if (field.type === 'PACKET') {
          schemaIndex = unpack(binaryData.buffer, DEFS.TYPES.UINT16, offset)
          offset += 2
        }
        if (DEFS.SCHEMES[schemaIndex] === undefined) {
          throw new ReferenceError(`${ErrorsCodes.SCHEMA_NOT_FOUND}: Invalid schemaIndex "${schemaIndex}", schema not found`) 
        }
        const schemaName = DEFS.SCHEMES_NAMES[schemaIndex]
        let schemaData = decodeData(DEFS.SCHEMES[schemaIndex], binaryData, offset)
        if (field.type === 'PACKET') {
          result = {
            schema: schemaName,
            packet: schemaData.data
          }
        } else {
          result = schemaData.data
        }
        offset = schemaData.offset
        break
      default:
        throw new ReferenceError(`${ErrorsCodes.INVALID_INPUT_DATA}: Undefinned field type "${field.type}"`)
    }
    return [result, offset]
  } catch (err) {
    throw new Error(`${ErrorsCodes.UNPACK_ERROR}: Field "${field.name}" decoding error ${err.message}`)
  }
}
