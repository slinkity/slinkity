const { join } = require('path')
const packageMeta = require('./package.json')

const client = join(packageMeta.name, 'client')
const server = join(packageMeta.name, 'server')
const toComponentByShortcode = join(packageMeta.name, 'StaticHtml')

/** @type {import('../slinkity').Renderer} */
module.exports = {
  name: 'react',
  extensions: ['jsx', 'tsx'],
  client,
  server,
  toComponentByShortcode,
  injectImportedStyles: true,
  viteConfig() {
    return {
      optimizeDeps: {
        include: [client, 'react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
        exclude: [server],
      },
      resolve: {
        dedupe: ['react', 'react-dom'],
      },
      ssr: {
        external: ['react-dom/server.js'],
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react'],
            },
          },
        },
      },
    }
  },
  page({ toCommonJSModule }) {
    return {
      useFormatted11tyData: true,
      async getData(inputPath) {
        const Component = await toCommonJSModule(inputPath)
        return Component.frontMatter
      },
    }
  },
}
