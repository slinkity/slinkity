const snowpackServerPlugin = require('./utils/plugins/snowpackServerPlugin')
const reactPlugin = require('./utils/plugins/reactPlugin')
const sassPlugin = require('./utils/plugins/sassPlugin')

const dir = {
  input: 'src',
  output: '_site',
  includes: '_includes',
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(snowpackServerPlugin, { dir })
  eleventyConfig.addPlugin(reactPlugin, { dir })
  eleventyConfig.addPlugin(sassPlugin)

  return {
    dir,
  }
}
