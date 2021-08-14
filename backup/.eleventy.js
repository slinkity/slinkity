module.exports = function (eleventyConfig) {
  eleventyConfig.addPassthroughCopy('styles')

  return {
    dir: {
      input: 'src',
    },
  }
}
