const sass = require('sass')
const { promisify } = require('util')
const sassRender = promisify(sass.render)
const { dir } = require('../../utils/getConfigFromEnv')()
const { join } = require('path')

module.exports = function sassPlugin(eleventyConfig) {
  eleventyConfig.addTemplateFormats(['scss', 'css'])
  eleventyConfig.addPassthroughCopy(join(dir.includes, 'styles'))

  eleventyConfig.addExtension('scss', {
    read: false,
    outputFileExtension: 'css',
    getData: () => ({ layout: '' }),
    compile: (_, inputPath) => async () => {
      const { css } = await sassRender({ file: inputPath })
      return css
    },
  })
}
