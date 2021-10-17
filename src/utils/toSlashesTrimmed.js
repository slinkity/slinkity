module.exports = function toSlashesTrimmed(url) {
  return url.replace(/^\/|\/$/g, '')
}
