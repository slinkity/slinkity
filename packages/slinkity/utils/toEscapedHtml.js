/**
 * Escapes potentially invalid HTML characters for a given string
 * @param {string} value String to escape
 * @returns Escaped string for use in Html
 */
module.exports = function toEscapedHtml(value) {
  // https://stackoverflow.com/a/7382028
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
