const pkg = require('./package.json')
const { default: vitePreact } = require('@preact/preset-vite')

const client = `${pkg.name}/client`
const server = `${pkg.name}/server`

module.exports = {
  name: 'preact',
  extensions: ['jsx', 'tsx'],
  client,
  server,
  viteConfig() {
    return {
      plugins: [vitePreact()],
    }
  },
}
