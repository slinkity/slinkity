const toHtmlAttrString = require('../../utils/toHtmlAttrString')
const toPropsHash = require('../../utils/toPropsHash')

module.exports = function toRendererHtml({
  componentPath = '',
  Component = () => {},
  props = {},
  render = 'eager',
  isPage = false,
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
      ['data-s-path']: componentPath,
      ['data-s-hash-id']: toPropsHash({ componentPath, props }),
    }
    if (render === 'lazy') {
      attrs['data-s-lazy'] = true
    }
    if (isPage) {
      attrs['data-s-page'] = true
    }
    return `<slinkity-react-renderer ${toHtmlAttrString(
      attrs,
    )}>${elementAsHTMLString}</slinkity-react-renderer>`
      .replace(/\n/g, '')
      .trim()
  }
}
