const pluginSass = require('eleventy-plugin-sass')
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const yaml = require('js-yaml')

module.exports = function config(eleventyConfig) {
  eleventyConfig.addPlugin(pluginSass)
  eleventyConfig.addPassthroughCopy('assets')
  eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents))
  eleventyConfig.addPlugin(syntaxHighlight)

  return {
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'src',
    },
  }
}
