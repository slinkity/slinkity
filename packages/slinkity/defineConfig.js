/**
 * @typedef {import('./index').UserSlinkityConfig} UserSlinkityConfig
 *
 * @param {Partial<UserSlinkityConfig>} userConfig
 * @returns {UserSlinkityConfig} formatted Slinkity Config with defaults applied for omitted keys
 */
function defineConfig(userConfig = {}) {
  return {
    eleventyIgnores: userConfig.eleventyIgnores ?? ((ignores) => ignores),
  }
}

module.exports = {
  defineConfig,
}
