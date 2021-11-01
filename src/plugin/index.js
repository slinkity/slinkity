/**
 * @typedef SlinkityConfigOptions
 * @property {{
 *  input: string;
 *  output: string;
 *  includes: string;
 *  layouts: string;
 * }} dir - paths to all significant directories, as specified in 11ty's "dir" documentation
 * @property {import('../cli/toViteSSR').ViteSSR | null} viteSSR - utility to import components as Node-friendly modules
 * @property {import('browser-sync').Options} browserSyncOptions - Slinkity's own browser sync server for dev environments
 * @property {'dev' | 'prod'} environment - whether we want a dev server or a production build
 */

const reactPlugin = require('./reactPlugin')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const { toComponentAttrStore } = require('./componentAttrStore')
const browserSync = require('browser-sync')
const { relative } = require('path')
const { toHydrationLoadersApplied } = require('./reactPlugin/2-pageTransform')
const { applyViteHtmlTransform } = require('./applyViteHtmlTransform');

/**
 * @param {SlinkityConfigOptions} - all Slinkity plugin options
 * @returns (eleventyConfig: Object) => Object - config we'll apply to the Eleventy object
 */
module.exports = function slinkityConfig(options) {
  const { dir, viteSSR, browserSyncOptions, environment } = options;
  const componentAttrStore = toComponentAttrStore()

  return function (eleventyConfig) {
    eleventyConfig.addPlugin(reactPlugin, {
      dir,
      viteSSR,
      componentAttrStore,
    })

    eleventyConfig.addTransform(
      'apply-react-hydration-loaders',
      async function (content, outputPath) {
        if (!outputPath.endsWith('.html')) return content

        const componentAttrs = componentAttrStore
          .getAllByPage(outputPath)
          // only get components that need hydration loaders
          .filter(({ hydrate }) => hydrate !== 'static')

        return await toHydrationLoadersApplied({
          content,
          componentAttrs,
          dir,
        })
      },
    )

    if (environment === 'dev') {
      const urlToOutputHtmlMap = {}

      browserSync.create()
      browserSync.init({
        ...browserSyncOptions,
        middleware: [
          async function viteTransformMiddleware(req, res, next) {
            const page = urlToOutputHtmlMap[toSlashesTrimmed(req.originalUrl)]
            if (page) {
              const { content, outputPath } = page
              res.write(await applyViteHtmlTransform({ content, outputPath, componentAttrStore }, options))
              res.end()
            } else {
              next()
            }
          },
          viteSSR.server.middlewares,
        ],
      })

      eleventyConfig.on('beforeBuild', () => {
        componentAttrStore.clear()
      })

      eleventyConfig.addTransform(
        'update-url-to-compiled-html-map',
        function (content, outputPath) {
          const relativePath = relative(dir.output, outputPath)
          const formattedAsUrl = toSlashesTrimmed(
            relativePath.replace(/.html$/, '').replace(/index$/, ''),
          )
          urlToOutputHtmlMap[formattedAsUrl] = {
            outputPath,
            content,
          }
          return content
        },
      )
    }

    if (environment === 'prod') {
      eleventyConfig.addTransform('apply-vite', async function (content, outputPath) {
        return await applyViteHtmlTransform({ content, outputPath, componentAttrStore }, options)
      })
    }
    return {}
  }
}
