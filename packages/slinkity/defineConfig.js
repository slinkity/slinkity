/**
 * @type {import('./defineConfig').defineConfig}
 */
function defineConfig(userConfig = {}) {
  return {
    renderers: userConfig.renderers ?? [],
    componentDir: userConfig.componentDir ?? 'components',
    eleventyIgnores: userConfig.eleventyIgnores ?? ((ignores) => ignores),
  }
}

module.exports = {
  defineConfig,
}
