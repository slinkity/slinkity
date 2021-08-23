const toEscapedHtml = require('./toEscapedHtml')

/**
 * Converts an object of mixed types to a single string of Html attributes
 * Ex. { key: 'value', number: 42 } -> `key="value" number="42"`
 * @param {object} props Set of key / value pairs to stringify
 * @returns String of Html attributes to apply to an element
 */
module.exports = function toHtmlAttrString(props = {}) {
  return Object.entries(props)
    .reduce((htmlAttrs, [key, value]) => {
      return [...htmlAttrs, `${key}="${toEscapedHtml(`${value}`)}"`]
    }, [])
    .join(' ')
}
