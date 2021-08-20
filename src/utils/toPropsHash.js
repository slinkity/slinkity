const crypto = require('crypto')
const { stringify } = require('javascript-stringify')

module.exports = function toPropsHash({ componentPath = '', props = {} }) {
  const hash = crypto.createHash('md5').update(componentPath).update(stringify(props)).digest('hex')
  return hash
}
