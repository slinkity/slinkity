module.exports = function toHtmlAttrString(props = {}) {
  return Object.entries(props)
    .reduce((htmlAttrs, [key, value]) => {
      return [...htmlAttrs, `${key}="${value}"`]
    }, [])
    .join(' ')
}
