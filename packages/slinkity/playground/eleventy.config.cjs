const slinkity = require('slinkity')
const preact = require('@slinkity/preact')

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [preact()],
    }),
  )

  return {
    dir: {
      input: 'src',
    }
  }
}
