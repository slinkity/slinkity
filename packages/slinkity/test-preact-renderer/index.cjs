const path = require('path')
const { default: preact } = require('@preact/preset-vite')

const server = path.resolve('server.cjs')

module.exports = function preactRenderer() {
  return {
    name: 'react',
    extensions: ['jsx', 'tsx'],
    server,
    injectImportedStyles: true,
    viteConfig() {
      return {
        plugins: [preact()],
      }
    },
  }
}
