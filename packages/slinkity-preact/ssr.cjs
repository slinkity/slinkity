const { h } = require('preact')
const renderToString = require('preact-render-to-string')
const pkg = require('./package.json')

module.exports = async function ssr({ Component, props, ssrLoadModule, javascriptFunctions }) {
  const FunctionsProvider = await ssrLoadModule(`${pkg.name}/FunctionsProvider`)
  const vnode = h(FunctionsProvider.default, { javascriptFunctions }, h(Component.default, props))
  return {
    html: renderToString(vnode),
    css: undefined,
  }
}
