/**
 * @typedef {'eager' | 'lazy' | 'static'} HydrationMode
 *
 * @typedef RenderToStaticMarkupParams
 * @property {any} Component ESM component module to render
 * @property {Record<string, any>} props Collection of key / value props
 * @property {HydrationMode} hydrate Mode Slinkity uses for clientside hydration
 * @property {string} children HTML string to be used as Component children
 *
 * @typedef ServerRenderer
 * @property {(params: RenderToStaticMarkupParams) => { html: string; css: string; }} renderToStaticMarkup
 *
 * @typedef Renderer
 * @property {string} name
 * @property {string[]} extensions
 * @property {string} client
 * @property {string} server
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
