const { v4: uuidv4 } = require('uuid')
const { toSsrComment, handleProp } = require('./utils.cjs')

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
 * @param {import('./@types').UserConfig} userConfig
 * @param {Pick<import('./@types').PluginGlobals, 'ssrIslandsByInputPath' | 'propsByInputPath' | 'extToRendererMap' | 'viteServer'>} pluginGlobals
 */
module.exports = function pages(
  eleventyConfig,
  userConfig,
  { ssrIslandsByInputPath, propsByInputPath, extToRendererMap, viteServer },
) {
  for (const [ext, renderer] of extToRendererMap.entries()) {
    if (renderer.page) {
      eleventyConfig.addTemplateFormats(ext)
      eleventyConfig.addExtension(ext, {
        read: false,
        async getData(inputPath) {
          const server = viteServer.get() ?? (await viteServer.init())
          const Component = await server.ssrLoadModule(inputPath)
          return await renderer.page({ Component }).getData()
        },
        compileOptions: {
          permalink() {
            const __functions = this
            return function render({ permalink, ...data }) {
              if (typeof permalink === 'function') {
                return permalink({ ...data, __functions })
              } else {
                return permalink
              }
            }
          },
        },
        compile(_, inputPath) {
          return async function render(data) {
            const islandId = uuidv4()

            /** @type {Set<string>} */
            const propIds = new Set()
            for (const [name, value] of Object.entries(data)) {
              const { id } = handleProp({ name, value, propsByInputPath, inputPath })
              propIds.add(id)
            }

            const existingSsrComponents = ssrIslandsByInputPath.get(inputPath)
            ssrIslandsByInputPath.set(inputPath, {
              ...existingSsrComponents,
              [islandId]: {
                islandPath: inputPath,
                propIds,
                slots: { default: null },
              },
            })

            return toSsrComment(islandId)
          }
        },
      })
    }
  }
}
