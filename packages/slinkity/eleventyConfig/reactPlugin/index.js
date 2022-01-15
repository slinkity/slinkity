const addShortcode = require('./addShortcode')
const addPageExtension = require('./addPageExtension')

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @typedef ReactPluginOptions
 * @property {import('..').SlinkityConfigOptions['viteSSR']} viteSSR
 * @property {Record<string, Object>} urlToCompiledHtmlMap
 * @property {import('../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../../cli/vite').ResolvedImportAliases} resolvedImportAliases
 * @param {ReactPluginOptions} options - all React plugin options
 */
module.exports = function reactPlugin(
  eleventyConfig,
  { viteSSR, componentAttrStore, resolvedImportAliases },
) {
  addPageExtension(eleventyConfig, { componentAttrStore, viteSSR, resolvedImportAliases })
  addShortcode(eleventyConfig, { componentAttrStore, resolvedImportAliases })
}
