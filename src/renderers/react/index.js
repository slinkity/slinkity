const { defineConfig } = require('vite')
const { join } = require('path')
const packageMeta = require('./package.json')

const client = join(packageMeta.name, 'client')
const server = join(packageMeta.name, 'server')

module.exports = {
  name: 'react',
  extensions: ['jsx', 'tsx'],
  client,
  server,
  viteConfig() {
    return defineConfig({
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
              react: 'react',
            },
          },
        },
      },
    })
  },
  page({ loadedModule, eleventyConfig, extension }) {
    return {
      getData() {
        return loadedModule.frontMatter
      },
      // defaults to "static"
      getHydrationMode(data) {
        return data.hydrate
      },
      // whether to format collections for better clientside parsing
      useFormatted11tyData: true,
      async getProps(data) {
        const { getProps } = loadedModule
        return await getProps({
          ...data,
          shortcodes: eleventyConfig.javascriptFunctions ?? {},
        })
      },
    }
  },
  eleventyIgnores(resolvedImportAliases) {
    return [
      join(resolvedImportAliases.includes, '**', 'module.css'),
      join(resolvedImportAliases.includes, '**', 'module.scss'),
    ]
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
