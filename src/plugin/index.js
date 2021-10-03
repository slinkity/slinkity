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

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @param {PluginOptions} options - all Slinkity plugin options
 */
module.exports = function (eleventyConfig, options) {
  reactPlugin(eleventyConfig, options)
}
