const slinkity = require('./plugin')
const { config: userConfigPath, dir } = JSON.parse(process.env.SLINKITY_CONFIG)

let userConfig = () => {}
try {
  userConfig = require(userConfigPath)
} catch (e) {}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(slinkity, { dir })

  return {
    ...userConfig(eleventyConfig),
    dir,
  }
}
