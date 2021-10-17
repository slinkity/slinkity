const { join } = require('path')
const toUnixPath = require('../../../utils/toUnixPath')

module.exports = function toClientImportStatement(fileName = '') {
  return JSON.stringify(toUnixPath(join('slinkity/lib/plugin/reactPlugin/_client', fileName)))
}
