import DEFS from './defs.js'
import ErrorsCodes from './errors.js'

/**
 * @param {object} protocol - Protocol definitions
 */
export function update(protocol) {
  DEFS.VERSION = protocol.VERSION
  DEFS.TYPES = protocol.TYPES
  DEFS.SCHEMES_NAMES = protocol.SCHEMES_NAMES
  DEFS.SCHEMES = protocol.SCHEMES
  DEFS.compile()
}

export function getVersion() {
  return DEFS.VERSION
}

export function setVersion(version) {
  DEFS.VERSION = version
}

function resetVersion() {
  DEFS.VERSION = 0
}

/**
 * 
 * @param {string} name - Schema name
 * @param {object} fields - Fields definitions
 * @returns 
 */
export function addSchema(name, fields = []) {
  if (DEFS.SCHEMES_NAMES.indexOf(name) > -1) {
    throw new Error(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE}: Schema "${name}" already in use`)
  }

  if (!Array.isArray(fields)) {
    throw new Error(`${ErrorsCodes.INVALID_INPUT_DATA_VALUE}: Fields is not array`)
  }

  const index = DEFS.SCHEMES_NAMES.length
  DEFS.SCHEMES_NAMES.push(name)
  DEFS.INDEX[name] = index
  DEFS.SCHEMES[index] = fields
  DEFS.compile()

  return DEFS.SCHEMES[DEFS.INDEX[name]]
}

export function addSchemes(schemes) {
  for (let schema in schemes) {
    addSchema(schema, schemes[schema])
  }
}

function getSchemesList() {
  return DEFS.SCHEMES_NAMES
}

function getSchemaDescription(schema) {
  const schemaIndex = DEFS.SCHEMES_NAMES.indexOf(schema)
  if (schemaIndex < 0) {
    return error(100, `Schema [${schema}] not found`)
  }
  let result = []
  let field
  let fieldDescription
  for (let i in DEFS.SCHEMES[schemaIndex]) {
    field = DEFS.SCHEMES[schemaIndex][i]
    fieldDescription = field.name + (field.optional ? '?' : '') + ': '
    fieldDescription += field.type
    if (field.type === 'ARRAY') {
      if (field.items.items) {
        fieldDescription += '[' + field.items.items.type + '...]'
      } else {
        fieldDescription += '[' + field.items.type + '...]'
      }
    }
    result.push(fieldDescription)
  }
  return `${schema}: [ ${result.join(', ')} ]`
}

function getInfo() {
  return DEFS
}

 export function getLock(isLocked) {
  return DEFS.IS_LOCKED
}

export function setLock(isLocked) {
  DEFS.IS_LOCKED = !!isLocked
}