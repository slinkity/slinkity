const { sep } = require('path')

module.exports = function toUnixPath(originalPath = '') {
  return originalPath.split(sep).join('/')
}
