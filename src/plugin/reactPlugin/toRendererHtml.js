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
    const isLazy = render === 'lazy'
    return `<slinkity-react-renderer data-s-path="${componentPath}" ${
      isPage ? 'data-s-page="true"' : ''
    } ${isLazy ? 'data-s-lazy="true"' : ''}>${elementAsHTMLString}</slinkity-react-renderer>`
      .replace(/\n/g, '')
      .trim()
  }
}
