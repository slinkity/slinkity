const viteServerPlugin = require('./utils/plugins/viteServerPlugin')
const reactPlugin = require('./utils/plugins/reactPlugin')
const sassPlugin = require('./utils/plugins/sassPlugin')

const dir = {
  input: 'src',
  output: '_site',
  includes: '_includes',
}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(viteServerPlugin, { dir })
  eleventyConfig.addPlugin(reactPlugin, { dir })
  eleventyConfig.addPlugin(sassPlugin)

  return {
    dir,
  }
}
