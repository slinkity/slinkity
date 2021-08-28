const { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } = require('../../utils/consts')
const toHtmlAttrString = require('../../utils/toHtmlAttrString')
const toUnixPath = require('../../utils/toUnixPath')

module.exports = function toRendererHtml({
  componentPath = '',
  Component = () => {},
  props = {},
  render = 'eager',
  innerHTML = '',
}) {
  // only import these dependencies when triggered
  // this prevents "cannot find module react*"
  // when running slinkity without react and react-dom installed
  const parseHtmlToReact = require('html-react-parser')
  const { renderToString } = require('react-dom/server')
  const elementAsHTMLString = renderToString(
    require('react').createElement(Component, props, parseHtmlToReact(innerHTML || '')),
  )
  if (render === 'static') {
    return elementAsHTMLString
  } else {
    const attrs = {
      [SLINKITY_ATTRS.path]: toUnixPath(componentPath),
    }
    if (render === 'lazy') {
      attrs[SLINKITY_ATTRS.lazy] = true
    }
    return `<${SLINKITY_REACT_MOUNT_POINT} ${toHtmlAttrString(
      attrs,
    )}>${elementAsHTMLString}</${SLINKITY_REACT_MOUNT_POINT}>`
      .replace(/\n/g, '')
      .trim()
  }
}
