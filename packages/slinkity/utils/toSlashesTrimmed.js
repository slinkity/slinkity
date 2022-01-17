/**
 * Returns a URL with leading and trailing slashes trimmed.
 *
 * @param  {string} url URL with or without slashes.
 * @return {string}     URL with slashes trimmed.
 */
function toSlashesTrimmed(url) {
  return url.replace(/^\/|\/$/g, '')
}

module.exports = toSlashesTrimmed
