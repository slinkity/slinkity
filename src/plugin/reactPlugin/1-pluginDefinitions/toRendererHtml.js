const { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } = require('../../../utils/consts')
const toHtmlAttrString = require('../../../utils/toHtmlAttrString')

const toBasicMinified = (str = '') => str.replace(/\n/g, '').trim()

/**
 * Generates a string of HTML from a React component,
 * with a hydration mount point + attributes applied when necessary
 * @param {{
 *  Component: () => void,
 *  render: 'eager' | 'lazy' | 'static',
 *  id: string,
 *  props?: Object.<string, Any>,
 *  innerHTML?: string
 * }} params Component to process with all related attributes
 * @returns {string} Mount point with parameters + children applied
 */
module.exports = function toRendererHtml({ Component, render, id, props = {}, innerHTML = '' }) {
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

  if (render === 'static') {
    const elementAsHTMLString = renderToStaticMarkup(reactElement)
    const minified = toBasicMinified(elementAsHTMLString)
    return minified
  } else {
    const elementAsHTMLString = renderToString(reactElement)
    const attrs = toHtmlAttrString({
      [SLINKITY_ATTRS.id]: id,
    })
    const mountPointApplied = `<${SLINKITY_REACT_MOUNT_POINT} ${attrs}>${elementAsHTMLString}</${SLINKITY_REACT_MOUNT_POINT}>`
    const minified = toBasicMinified(mountPointApplied)
    return minified
  }
}
