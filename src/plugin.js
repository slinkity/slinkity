const viteBuildPlugin = require('./plugins/viteBuildPlugin')
const reactPlugin = require('./plugins/reactPlugin')
const sassPlugin = require('./plugins/sassPlugin')

const mode = process.env.SLINKITY_SERVE ? 'serve' : 'build'

module.exports = function (eleventyConfig, options) {
  eleventyConfig.addPlugin(reactPlugin, options)
  eleventyConfig.addPlugin(sassPlugin)

  if (mode === 'build') {
    eleventyConfig.addPlugin(viteBuildPlugin, options)
  }
}
