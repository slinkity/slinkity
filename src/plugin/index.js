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
              console.log({ outputPath })
              res.write(await viteSSR.server.transformIndexHtml(outputPath, content))
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

      // if (viteSSR.server) {
      //   console.log({ path: relative(dir.output, outputPath), output: dir.output, outputPath })
      //   return await viteSSR.server.transformIndexHtml('/index.html', withHydrationLoadersApplied)
      // } else {
      //   return withHydrationLoadersApplied
      // }
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
