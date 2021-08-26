const { join } = require('path')

module.exports = function toClientImportStatement(fileName = '') {
  return JSON.stringify(join('slinkity/lib/plugin/reactPlugin/_client', fileName))
}
