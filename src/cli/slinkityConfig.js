const slinkity = require('../plugin')

module.exports =
  ({ dir }) =>
    (eleventyConfig) => {
      eleventyConfig.addPlugin(slinkity, { dir })

      return {}
    }
