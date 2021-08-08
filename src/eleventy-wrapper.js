const slinkity = require('./plugin')
const { config: userConfigPath, dir } = JSON.parse(process.env.SLINKITY_CONFIG)

let userConfigFn
try {
  userConfigFn = require(userConfigPath)
} catch (e) {}

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(slinkity, { dir })

  const userConfig = userConfigFn?.(eleventyConfig) ?? {}
  return { ...userConfig, dir }
}
