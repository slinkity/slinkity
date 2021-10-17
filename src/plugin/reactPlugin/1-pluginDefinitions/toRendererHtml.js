const toBasicMinified = (str = '') => str.replace(/\n/g, '').trim()

/**
 * Generates a string of HTML from a React component,
 * with a hydration mount point + attributes applied when necessary
 * @param {{
 *  Component: () => void,
 *  hydrate: 'eager' | 'lazy' | 'static',
 *  props?: Object.<string, Any>,
 *  innerHTML?: string
 * }} params Component to process with all related attributes
 * @returns {string} Mount point with parameters + children applied
 */
function toRendererHtml({ Component, hydrate, props = {}, innerHTML = '' }) {
  // only import these dependencies when triggered
  // this prevents "cannot find module react*"
  // when running slinkity without react and react-dom installed
  const parseHtmlToReact = require('html-react-parser')
  const { renderToString, renderToStaticMarkup } = require('react-dom/server')
  const reactElement = require('react').createElement(
    Component,
    props,
    parseHtmlToReact(innerHTML || ''),
  )

  const elementAsHTMLString =
    hydrate === 'static' ? renderToStaticMarkup(reactElement) : renderToString(reactElement)
  return toBasicMinified(elementAsHTMLString)
}

module.exports = {
  toRendererHtml,
}
