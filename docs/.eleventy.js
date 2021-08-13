const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight')
const sassPlugin = require('eleventy-plugin-sass')
const yaml = require('js-yaml')

module.exports = function config(eleventyConfig) {
  eleventyConfig.addPassthroughCopy('assets')
  eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents))
  eleventyConfig.addPlugin(syntaxHighlight)
  eleventyConfig.addPlugin(sassPlugin)

  return {
    htmlTemplateEngine: 'njk',
    dir: {
      input: 'src',
    },
  }
}
