const slinkity = require('../plugin')

module.exports = function slinkityConfig({ dir }) {
  return function (eleventyConfig) {
    eleventyConfig.addPlugin(slinkity, { dir })

    return {}
  }
}
