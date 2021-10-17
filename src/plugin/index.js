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
const { parse } = require('node-html-parser')
const { SLINKITY_ATTRS } = require('../utils/consts')
const { toRendererHtml } = require('./reactPlugin/1-pluginDefinitions/toRendererHtml')
const browserSync = require('browser-sync')
const { relative } = require('path')
const { toHydrationLoadersApplied } = require('./reactPlugin/2-pageTransform')

/**
 * @param {SlinkityConfigOptions} - all Slinkity plugin options
 * @returns (eleventyConfig: Object) => Object - config we'll apply to the Eleventy object
 */
module.exports = function slinkityConfig({ dir, viteSSR, browserSyncOptions, environment }) {
  const componentAttrStore = toComponentAttrStore()

  /**
   * @typedef ApplyViteHtmlTransformParams
   * @property {string} content - the original HTML content to transform
   * @property {string} outputPath - the output path this HTML content will be written to
   * @param {ApplyViteHtmlTransformParams}
   * @returns {string} - HTML with statically rendered content and Vite transforms applied
   */
  async function applyViteHtmlTransform({ content, outputPath }) {
    const root = parse(content)
    const mountPointsToSSR = root.querySelectorAll(`[${SLINKITY_ATTRS.ssr}="true"]`)
    const allComponentAttrsForPage = componentAttrStore.getAllByPage(outputPath)
    const pageStyles = {}
    for (const mountPointToSSR of mountPointsToSSR) {
      const id = mountPointToSSR.getAttribute(SLINKITY_ATTRS.id)
      const componentAttrs = allComponentAttrsForPage[id]
      if (componentAttrs) {
        const { path: componentPath, props, hydrate } = componentAttrs
        const { default: Component, __stylesGenerated } = await viteSSR.toComponentCommonJSModule(
          componentPath,
        )
        Object.assign(pageStyles, __stylesGenerated)
        // TODO: abstract renderer imports to be framework-agnostic
        // (importing directly from the React plugin right now)
        mountPointToSSR.innerHTML = toRendererHtml({
          Component,
          props,
          hydrate,
        })
      }
    }
    root
      .querySelector('body')
      .insertAdjacentHTML('beforeend', `<style>${Object.values(pageStyles).join('\n')}</style>`)

    const routePath = '/' + toSlashesTrimmed(relative(dir.output, outputPath))
    return environment === 'dev'
      ? viteSSR.server.transformIndexHtml(routePath, root.outerHTML)
      : root.outerHTML
  }

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
              res.write(await applyViteHtmlTransform({ content, outputPath }))
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
        return await applyViteHtmlTransform({ content, outputPath })
      })
    }
    return {}
  }
}
