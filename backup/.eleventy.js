module.exports = function (eleventyConfig) {
  console.log('called!')
  eleventyConfig.addPassthroughCopy('styles')

  return {
    dir: {
      output: '_merp',
    },
  }
}
