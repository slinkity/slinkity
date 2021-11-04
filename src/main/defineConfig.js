/**
 * @typedef Renderer
 * @property {string} name
 * @property {string[]} extensions
 * @property {string} client
 * @property {(any) => any} server
 * @property {import('vite').UserConfigExport} viteConfig
 * @property {(any) => any} page
 * @property {(resolvedImportAliases: import('../utils/consts').ImportAliases) => string[]} eleventyIgnores
 *
 * @typedef UserSlinkityConfig
 * @property {string[] | (ignores: string[]) => string[]} eleventyIgnores All files (or globs) Slinkity will ask 11ty to ignore during builds and live reload events. Override this property to add and remove ignored files from our defaults. Also see 11ty's ignore documentation here: https://www.11ty.dev/docs/ignores/
 * @property {Renderer[]} renderers Renderers to use for component shortcodes and component pages
 *
 * @param {Partial<UserSlinkityConfig>} userConfig
 * @returns {UserSlinkityConfig} formatted Slinkity Config with defaults applied for omitted keys
 */
function defineConfig(userConfig = {}) {
  return {
    eleventyIgnores: userConfig.eleventyIgnores ?? ((ignores) => ignores),
    renderers: userConfig.renderers ?? [],
  }
}

module.exports = {
  defineConfig,
}
