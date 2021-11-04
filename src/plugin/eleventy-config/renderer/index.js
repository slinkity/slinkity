const { addPageExtensions } = require('./addPageExtensions')
const { addShortcode } = require('./addShortcode')

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @typedef RendererOptions
 * @property {import('../..').SlinkityConfigOptions['viteSSR']} viteSSR
 * @property {import('../../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../../../cli/vite').ResolvedImportAliases} resolvedImportAliases
 * @property {import('../../../main/defineConfig').UserSlinkityConfig['renderers']} renderers
 * @param {RendererOptions} options - all React plugin options
 */
module.exports.rendererConfig = function (
  eleventyConfig,
  { viteSSR, componentAttrStore, resolvedImportAliases, renderers },
) {
  for (const renderer of renderers) {
    addPageExtensions(eleventyConfig, {
      viteSSR,
      componentAttrStore,
      resolvedImportAliases,
      renderer,
    })
    addShortcode(eleventyConfig, {
      componentAttrStore,
      resolvedImportAliases,
      renderer,
    })
  }
}
