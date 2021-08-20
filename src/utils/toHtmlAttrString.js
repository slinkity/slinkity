const toEscapedHtml = require('./toEscapedHtml')

module.exports = function toHtmlAttrString(props = {}) {
  return Object.entries(props)
    .reduce((htmlAttrs, [key, value]) => {
      return [...htmlAttrs, `${key}="${toEscapedHtml(value)}"`]
    }, [])
    .join(' ')
}
