const { renderToString } = require('react-dom/server')
const parseHtmlToReact = require('html-react-parser')
const React = require('react')

module.exports = function toRendererHtml({
  componentPath = '',
  Component = () => {},
  props = {},
  render = 'eager',
  isPage = false,
  innerHTML = '',
}) {
  const elementAsHTMLString = renderToString(
    React.createElement(Component, props, parseHtmlToReact(innerHTML || ''))
  )
  if (render === 'static') {
    return elementAsHTMLString
  } else {
    const isLazy = render === 'lazy'
    return `<slinkity-react-renderer data-s-path="${componentPath}" ${
      isPage ? 'data-s-page="true"' : ''
    } ${
      isLazy ? 'data-s-lazy="true"' : ''
    }>${elementAsHTMLString}</slinkity-react-renderer>`
      .replace(/\n/g, '')
      .trim()
  }
}
