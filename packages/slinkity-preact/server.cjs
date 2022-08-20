const { h } = require('preact')
const renderToString = require('preact-render-to-string')

export default async function server({ Component, props }) {
  const vnode = h(Component.default, props)
  return {
    html: renderToString(vnode),
    css: undefined,
  }
}
