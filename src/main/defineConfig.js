/**
 * @typedef UserSlinkityConfig
 * @property {string[] | (ignores: string[]) => string[]} eleventyIgnores All files (or globs) Slinkity will ask 11ty to ignore during builds and live reload events. Override this property to add and remove ignored files from our defaults. Also see 11ty's ignore documentation here: https://www.11ty.dev/docs/ignores/
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
