const { join } = require('path')
const { addPageExtension, addShortcode } = require('./1-pluginDefinitions')

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @typedef ReactPluginOptions
 * @property {import('..').SlinkityConfigOptions['dir']} dir
 * @property {import('..').SlinkityConfigOptions['viteSSR']} viteSSR
 * @property {Record<string, Object>} urlToCompiledHtmlMap
 * @property {import('../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @param {ReactPluginOptions} options - all React plugin options
 */
module.exports = function reactPlugin(eleventyConfig, { dir, viteSSR, componentAttrStore }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  addPageExtension(eleventyConfig, { componentAttrStore, dir, viteSSR })
  addShortcode(eleventyConfig, { componentAttrStore, dir })
}
