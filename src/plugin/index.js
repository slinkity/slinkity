/**
 * @typedef PluginOptions
 * @property {{
 *  input: string;
 *  output: string;
 *  includes: string;
 *  layouts: string;
 * }} dir - paths to all significant directories, as specified in 11ty's "dir" documentation
 * @property {import('../cli/toViteSSR').ViteSSR | null} viteSSR - utility to import components as Node-friendly modules
 */

const reactPlugin = require('./reactPlugin')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const { toComponentAttrStore } = require('./componentAttrStore')
const { parse } = require('node-html-parser')
const { SLINKITY_ATTRS } = require('../utils/consts')
const { toRendererHtml } = require('./reactPlugin/1-pluginDefinitions/toRendererHtml')
const { join } = require('path')

/**
 * @param {PluginOptions} - all Slinkity plugin options
 * @returns (eleventyConfig: Object) => Object - config we'll apply to the Eleventy object
 */
module.exports = function slinkityConfig({ dir, viteSSR }) {
  const urlToCompiledHtmlMap = {}
  const componentAttrStore = toComponentAttrStore()

  return function (eleventyConfig) {
    if (viteSSR.server) {
      eleventyConfig.setBrowserSyncConfig({
        middleware: [
          viteSSR.server.middlewares,
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
                  const { default: Component, __stylesGenerated } =
                    await viteSSR.toComponentCommonJSModule(join(dir.output, componentPath))
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
                .insertAdjacentHTML(
                  'beforeend',
                  `<style>${Object.values(pageStyles).join('\n')}</style>`,
                )
              res.write(await viteSSR.server.transformIndexHtml(outputPath, root.outerHTML))
              res.end()
            } else {
              next()
            }
          },
        ],
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
