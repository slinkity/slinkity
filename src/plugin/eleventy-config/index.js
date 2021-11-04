const { rendererConfig } = require('./renderer')

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @param {import('./renderer').RendererOptions} options - all Slinkity-related options
 */
module.exports.applyEleventyConfig = function (eleventyConfig, options) {
  eleventyConfig.addPlugin(rendererConfig, options)
}
