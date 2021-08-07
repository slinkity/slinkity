const sass = require('sass')
const { promisify } = require('util')
const sassRender = promisify(sass.render)

module.exports = function sassPlugin(eleventyConfig) {
  eleventyConfig.addTemplateFormats('scss')

  eleventyConfig.addExtension('scss', {
    read: false,
    outputFileExtension: 'css',
    getData: () => ({ layout: '' }),
    compile: (_, inputPath) => async (data) => {
      const { css } = await sassRender({ file: inputPath })
      return css
    },
  })
}
