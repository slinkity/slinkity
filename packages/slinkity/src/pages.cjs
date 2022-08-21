const { v4: uuidv4 } = require('uuid')
const { z } = require('zod')
const {
  toSsrComment,
  addPropToStore,
  toClientScript,
  toClientPropsPathFromOutputPath,
  toResolvedPath,
} = require('./utils.cjs')

const islandMetaSchema = z.union([
  z.boolean(),
  z.object({
    on: z.array(z.string()).optional(),
    props: z
      .function(z.tuple(z.any()), z.union([z.record(z.any()), z.promise(z.record(z.any()))]))
      .optional(),
  }),
])

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
          const server = await viteServer.getOrInitialize()
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
          return async function render(serverData) {
            const islandId = uuidv4()
            const islandPath = toResolvedPath(inputPath)
            const existingSsrComponents = ssrIslandsByInputPath.get(inputPath)

            const server = await viteServer.getOrInitialize()
            const Component = await server.ssrLoadModule(inputPath)
            const unparsedIslandMeta = await renderer.page({ Component }).getIslandMeta()

            let isUsedOnClient = false
            /** @type {string[]} */
            let loadConditions = []
            /** @type {Record<string, any>} */
            let props = serverData

            if (unparsedIslandMeta) {
              let islandMeta
              try {
                islandMeta = islandMetaSchema.parse(unparsedIslandMeta)
              } catch {
                throw new Error(
                  `Unable to parse the "island" export from ${JSON.stringify(
                    inputPath,
                  )}. Try importing the "IslandExport" type from "slinkity" for some helpful autocomplete. See our docs for usage: https://slinkity.dev/docs/component-pages-layouts/#handle-props-on-hydrated-components`,
                )
              }
              isUsedOnClient = islandMeta === true || typeof islandMeta === 'object'
              if (isUsedOnClient) {
                props =
                  typeof islandMeta === 'object' && typeof islandMeta.props === 'function'
                    ? await islandMeta.props(serverData)
                    : {}
                loadConditions =
                  typeof islandMeta === 'object' && Array.isArray(islandMeta.on)
                    ? islandMeta.on.map((loadCondition) => `on:${loadCondition}`)
                    : []
              }
            }

            /** @type {Set<string>} */
            const propIds = new Set()

            for (const [name, value] of Object.entries(props)) {
              const { id } = addPropToStore({
                name,
                value,
                propsByInputPath,
                inputPath,
                isUsedOnClient,
              })
              propIds.add(id)
            }

            ssrIslandsByInputPath.set(inputPath, {
              ...existingSsrComponents,
              [islandId]: {
                islandPath,
                propIds,
                isUsedOnClient,
                slots: { default: null },
              },
            })

            if (isUsedOnClient) {
              const clientPropsPath = toClientPropsPathFromOutputPath(
                serverData.page.outputPath,
                eleventyConfig.dir.output,
              )
              return toClientScript({
                // Client-only page templates are not supported!
                isClientOnly: false,
                islandId,
                islandPath,
                loadConditions,
                clientPropsPath,
                clientRendererPath: renderer.clientEntrypoint,
                propIds,
              })
            } else {
              return toSsrComment(islandId)
            }
          }
        },
      })
    }
  }
}
