const { join } = require('path')
const packageMeta = require('./package.json')

const client = join(packageMeta.name, 'client')
const server = join(packageMeta.name, 'server')

/** @type {import('../slinkity').Renderer} */
module.exports = {
  name: 'react',
  extensions: ['jsx', 'tsx'],
  client,
  server,
  // process CSS imported with JavaScript
  processImportedStyles: true,
  viteConfig() {
    return {
      optimizeDeps: {
        include: [client, 'react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
      },
      exclude: [server],
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
      // whether to format collections for better clientside parsing
      useFormatted11tyData: true,
      async getData(inputPath) {
        const Component = await toCommonJSModule(inputPath)
        return Component.frontMatter
      },
    }
  },
  // Adds polyfills to Node's global object *yikes*
  polyfills: null,
  // List of imports to add as scripts on the client
  hydrationPolyfills: null,

  // Later TODO
  // https://github.com/snowpackjs/astro/blob/main/packages/astro/src/vite-plugin-jsx/index.ts
  jsxImportSource: null,
  jsxTransformOptions: null,
}
