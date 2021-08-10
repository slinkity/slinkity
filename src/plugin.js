const viteBuildPlugin = require('./plugins/viteBuildPlugin')
const reactPlugin = require('./plugins/reactPlugin')
const sassPlugin = require('./plugins/sassPlugin')

const mode = process.env.SLINKITY_SERVE ? 'serve' : 'build'

module.exports = function (eleventyConfig, options) {
  reactPlugin(eleventyConfig, options)
  sassPlugin(eleventyConfig)

  if (mode === 'build') {
    viteBuildPlugin(eleventyConfig, options)
  }
}
