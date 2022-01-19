/**
 * @type {import('./defineConfig').defineConfig}
 */
function defineConfig(userConfig = {}) {
  return {
    renderers: userConfig.renderers ?? [],
    eleventyIgnores: userConfig.eleventyIgnores ?? ((ignores) => ignores),
  }
}

module.exports = {
  defineConfig,
}
