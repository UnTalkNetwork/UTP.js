
/**
 * 
 * @param {array} field - field definition
 * @param {object} data - field data
 * @returns data | EError
 * 
 */
 function checkField(field, data) {
  if (field.optional === true && data === undefined) {
    return undefined
  }
  let output
  switch (field.type) {
    case 'BOOL':
      output = data
      break
    case 'INT8':
    case 'INT16':
    case 'INT32':
    case 'INT64':
    case 'DATE':
      if (!Number.isInteger(data) || !isFinite(data) || Math.floor(data) !== data) {
        return error(EError.CODES.INVALID_INPUT_DATA_TYPE, `Field "${field.name}": Invalid data type (${field.type}) [${data}]`, 'checkField')
      }
      output = data
      break
    case 'ENUM':
      if (field.list === undefined || !Array.isArray(field.list) || field.list.indexOf(data) < 0) {
        return error(EError.CODES.INVALID_INPUT_DATA_VALUE, `Field "${field.name}": ENUM value "${data}" not found in list (${field.list.join(', ')})`, 'checkField')
      }
      output = data
      break
    case 'STRING':
      if (typeof data !== 'string') {
        return error(EError.CODES.INVALID_INPUT_DATA_TYPE, `Field "${field.name}": Invalid data type (${field.type}) [${data}]`, 'checkField')
      }
      output = data
      break
    case 'ARRAY':
      if (field.items === undefined || field.items.type === undefined || data === undefined || !Array.isArray(data)) {
        return error(EError.CODES.INVALID_INPUT_DATA_TYPE, `Field "${field.name}": Invalid data type (${field.type}) [${data}]`, 'checkField')
      }
      let result = []
      for (let i = 0; i < data.length; i++) {
        if (field.items.type === 'ARRAY') {
          result[i] = []
          for (let j = 0; j < data[i].length; j++) {
            let fieldDefinition = {
              name: tempName,
              type: field.items.items.type
            }
            DEFS.SCHEMES[DEFS.INDEX.SCHEMA].forEach(f => {
              if (f.name !== 'name' && f.name !== 'type') {
                if (field.items.items[f.name]) {
                  fieldDefinition[f.name] = field.items.items[f.name]
                }
              }
            })
            let checkResult = checkField(fieldDefinition, data[i][j])
            if (isError(checkResult)) return checkResult
            result[i].push(checkResult)
          }
        } else {
          let fieldDefinition = {
            name: tempName,
            type: field.items.type
          }
          DEFS.SCHEMES[DEFS.INDEX.SCHEMA].forEach(f => {
            if (f.name !== 'name' && f.name !== 'type') {
              if (field.items[f.name]) {
                fieldDefinition[f.name] = field.items[f.name]
              }
            }
          })
          let checkResult = checkField(fieldDefinition, data[i])
          if (isError(checkResult)) return checkResult
          result.push(checkResult)
        }
      }
      output = result
      break
    case 'JSON':
      if (typeof data !== 'object') {
        return error(EError.CODES.INVALID_INPUT_DATA_TYPE, `Field "${field.name}": Invalid data type (${field.type})`, 'checkField')
      }
      output = data
      break
    case 'SCHEMA':
    case 'PACKET':
      if (typeof data !== 'object') {
        return error(EError.CODES.INVALID_INPUT_DATA_TYPE, `Field "${field.name}": Invalid data type (${field.type})`, 'checkField')
      }
      if (field.type === 'PACKET' && DEFS.SCHEMES_NAMES.indexOf[data.schema] < 0) {
        return error(EError.CODES.SCHEMA_NOT_FOUND, `Field "schema": Schema "${data.schema}" not found`, 'checkField')
      }
      const schemaIndex = field.type === 'SCHEMA' ? DEFS.INDEX[field.schema] : DEFS.INDEX[data.schema || data[tempName].schema]
      const dataValues = field.type === 'SCHEMA' ? (data[tempName] !== undefined ? data[tempName] : data) : (data[tempName] !== undefined ? data[tempName].packet : data.packet)
      let checkResult = check(DEFS.SCHEMES_NAMES[schemaIndex], dataValues)
      if (isError(checkResult)) return checkResult
      output = checkResult
      break
    default:
      break
  }
  return output
}

function check(schema, data) {
  const schemaIndex = DEFS.SCHEMES_NAMES.indexOf(schema)
  if (schemaIndex < 0) {
    return error(EError.CODES.SCHEMA_NOT_FOUND, `Schema "${schema}" not found`, 'check')
  }
  const schemaProto = DEFS.SCHEMES[schemaIndex]
  let result = {}
  for (let i in schemaProto) {
    let checkResult = checkField(schemaProto[i], data[schemaProto[i].name])
    if (isError(checkResult)) return checkResult
    if (checkResult !== undefined) {
      result[schemaProto[i].name] = checkResult
    }
  }
  return result
}