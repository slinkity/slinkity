/**
 * @typedef {string[]} EleventyIgnores All files (or globs) Slinkity will ask 11ty to ignore during builds and live reload events. Override this property to add and remove ignored files from our defaults. See 11ty's ignore documentation here: https://www.11ty.dev/docs/ignores/
 * @typedef SlinkityUserConfig
 * @property {EleventyIgnores | (defaults: EleventyIgnores) => EleventyIgnores} eleventyIgnores
 *
 * @param {Partial<SlinkityUserConfig>} userConfig
 * @returns {SlinkityUserConfig} formatted Slinkity Config with defaults applied for omitted keys
 */
function defineConfig(userConfig) {
  return {
    eleventyIgnores: userConfig.eleventyIgnores ?? ((defaults) => defaults),
  }
}

module.exports = {
  defineConfig,
}
