module.exports =
  ({ dir }) =>
  (eleventyConfig) => {
    eleventyConfig.addPassthroughCopy('public')
  }
