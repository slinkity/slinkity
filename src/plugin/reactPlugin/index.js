const { addPageExtension, addShortcode } = require('./1-pluginDefinitions')

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @typedef ReactPluginOptions
 * @property {import('..').SlinkityConfigOptions['viteSSR']} viteSSR
 * @property {Record<string, Object>} urlToCompiledHtmlMap
 * @property {import('../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @param {ReactPluginOptions} options - all React plugin options
 */
module.exports = function reactPlugin(eleventyConfig, { viteSSR, componentAttrStore }) {
  eleventyConfig.addTemplateFormats('jsx')

  addPageExtension(eleventyConfig, { componentAttrStore, viteSSR })
  addShortcode(eleventyConfig, { componentAttrStore })
}
