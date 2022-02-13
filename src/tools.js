/**
 * 
 * Binary tools
 * 
 */

const stringDecoder = new TextDecoder()
const stringEncoder = new TextEncoder()

/**
 * Pack number
 * @param {number} value integer or float
 * @param {!{bits: number,
 *   float: (boolean|undefined),
 *   signed: (boolean|undefined)}} options 
 * @returns {ArrayBuffer}
 * @throws {string}
 */
export function pack(value, options) {
  if (options.float) {
    if (![32, 64].includes(options.bits)) {
      throw new Error('Incorrect bits for value (float)')
    }
    let buffer = new ArrayBuffer(options.bits / 8)
    if (options.bits === 32) {
      new DataView(buffer).setFloat32(0, value)
      return buffer
    } else {
      new DataView(buffer).setFloat64(0, value)
      return buffer
    }
  } else {
    if (![8, 16, 32, 64].includes(options.bits)) {
      throw new Error('Incorrect bits for value (integer)')
    }
    let buffer = new ArrayBuffer(options.bits / 8)
    if (options.bits === 8) {
      if (options.signed) {
        new DataView(buffer).setInt8(0, value)
      } else {
        new DataView(buffer).setUint8(0, value)
      }
      return buffer
    }
    if (options.bits === 16) {
      if (options.signed) {
        new DataView(buffer).setInt16(0, value)
      } else {
        new DataView(buffer).setUint16(0, value)
      }
      return buffer
    }
    if (options.bits === 32) {
      if (options.signed) {
        new DataView(buffer).setInt32(0, value)
      } else {
        new DataView(buffer).setUint32(0, value)
      }
      return buffer
    }
    if (options.bits === 64) {
      new DataView(buffer).setFloat64(0, value)
      return buffer
    }
  }
  throw new Error('Incompatible options')
}

/**
 * Unpack number
 * @param {ArrayBuffer} buffer 
 * @param {!{bits: number,
 *   float: (boolean|undefined),
 *   signed: (boolean|undefined)}} options
 * @param {number} offset
 * @returns {number}
 * @throws {string}
 */
export function unpack(buffer, options, offset) {
  const view = new DataView(buffer, offset || 0)
  if (options.float) {
    if (![32, 64].includes(options.bits)) {
      throw new Error('Incorrect bits for value (float)')
    }
    if (options.bits === 32) {
      return view.getFloat32()
    } else {
      return view.getFloat64()
    }
  } else {
    if (![8, 16, 32, 64].includes(options.bits)) {
      throw new Error('Incorrect bits for value (integer)')
    }
    if (options.bits === 8) {
      return options.signed ? view.getInt8() : view.getUint8()
    }
    if (options.bits === 16) {
      return options.signed ? view.getInt16() : view.getUint16()
    }
    if (options.bits === 32) {
      return options.signed ? view.getInt32() : view.getUint32()
    }
    if (options.bits === 64) {
      return parseInt(view.getFloat64(0))
    }
  }
  throw new Error('Incompatible options')
}

/**
 * Pack string
 * @param {string} value 
 * @returns {ArrayBuffer}
 */
export function packString(value) {
  try {
    return stringEncoder.encode(value).buffer
  } catch (err) {
    throw new Error(`packString error: ${err.message}`)
  }
}

/**
 * Unpack string
 * @param {Uint8Array} buffer 
 * @returns {string}
 */
export function unpackString(buffer) {
  try {
    return stringDecoder.decode(buffer)
  } catch (err) {
    throw new Error(`unpackString error: ${err.message}`)
  }
}