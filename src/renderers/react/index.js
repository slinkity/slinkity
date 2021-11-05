const { defineConfig } = require('vite')
const parseHtmlToReact = require('html-react-parser')
const { renderToString, renderToStaticMarkup } = require('react-dom/server')
const { createElement } = require('react')
const { join } = require('path')

module.exports = {
  name: 'react',
  extensions: ['jsx', 'tsx'],
  // path to ES module for clientside use (can't import into Node)
  client: join(__dirname, '_client.js'),
  // TODO: should reference a file path for vite to process the module directly
  server({ loadedModule, hydrate, props = {}, innerHTMLString = '', extension }) {
    const { default: Component } = loadedModule
    const reactElement = createElement(Component, props, parseHtmlToReact(innerHTMLString || ''))

    if (hydrate === 'static') {
      return renderToStaticMarkup(reactElement)
    } else {
      return renderToString(reactElement)
    }
  },
  viteConfig() {
    return defineConfig({
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
      // see src/plugin/reactPlugin/1-pluginDefinitions/toFormattedDataForProps.js
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
