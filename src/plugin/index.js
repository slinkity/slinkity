/**
 * @typedef PluginOptions
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

/**
 * @param {PluginOptions} - all Slinkity plugin options
 * @returns (eleventyConfig: Object) => Object - config we'll apply to the Eleventy object
 */
module.exports = function slinkityConfig({ dir, viteSSR, browserSyncOptions, environment }) {
  const urlToCompiledHtmlMap = {}
  const componentAttrStore = toComponentAttrStore()

  async function applyViteHtmlTransform(req, res, next) {
    const page = urlToCompiledHtmlMap[toSlashesTrimmed(req.originalUrl)]
    if (page) {
      const { content, outputPath } = page
      const root = parse(content)
      const mountPointsToSSR = root.querySelectorAll(`[${SLINKITY_ATTRS.ssr}="true"]`)
      const pageStyles = {}
      for (const mountPointToSSR of mountPointsToSSR) {
        const id = mountPointToSSR.getAttribute(SLINKITY_ATTRS.id)
        if (id) {
          const { path: componentPath, props, hydrate } = componentAttrStore.get(id)
          const { default: Component, __stylesGenerated } = await viteSSR.toComponentCommonJSModule(
            componentPath,
          )
          Object.assign(pageStyles, __stylesGenerated)
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
      res.write(await viteSSR.server.transformIndexHtml(outputPath, root.outerHTML))
      res.end()
    } else {
      next()
    }
  }

  return function (eleventyConfig) {
    if (environment === 'dev') {
      browserSync.create()
      browserSync.init({
        ...browserSyncOptions,
        middleware: [applyViteHtmlTransform, viteSSR.server.middlewares],
      })

      eleventyConfig.on('beforeBuild', () => {
        componentAttrStore.clear()
      })
    }

    eleventyConfig.addPlugin(reactPlugin, {
      dir,
      viteSSR,
      urlToCompiledHtmlMap,
      componentAttrStore,
    })

    return {}
  }
}
