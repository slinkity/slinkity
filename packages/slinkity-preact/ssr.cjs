const { h } = require('preact')
const renderToString = require('preact-render-to-string')

module.exports = function ssr({ Component, props }) {
  const vnode = h(Component.default, props)
  return {
    html: renderToString(vnode),
    css: undefined,
  }
}
