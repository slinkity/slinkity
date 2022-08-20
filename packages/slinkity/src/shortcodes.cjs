const devalue = require('devalue')
const { v4: uuidv4, v5: uuidv5 } = require('uuid')
const {
  toSsrComment,
  toPropComment,
  toClientPropsPathFromOutputPath,
  toResolvedIslandPath,
  extractPropIdsFromHtml,
  toClientScript,
  toIslandExt,
} = require('./utils.cjs')
const { BUILD_ID } = require('./consts.cjs')

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
 * @param {import('./@types').UserConfig} userConfig
 * @param {Pick<import('./@types').PluginGlobals, 'ssrIslandsByInputPath' | 'propsByInputPath' | 'extToRendererMap'>} pluginGlobals
 */
module.exports = function shortcodes(
  eleventyConfig,
  userConfig,
  { ssrIslandsByInputPath, propsByInputPath, extToRendererMap },
) {
  eleventyConfig.addPairedShortcode(
    'serverOnlyIsland',
    function (htmlWithPropComments, unresolvedIslandPath) {
      const { inputPath } = this.page
      const islandId = uuidv4()
      const islandPath = toResolvedIslandPath(unresolvedIslandPath, userConfig.islandsDir)
      const { htmlWithoutPropComments, propIds } = extractPropIdsFromHtml(htmlWithPropComments)

      const existingSsrComponents = ssrIslandsByInputPath.get(inputPath)
      ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrComponents,
        [islandId]: {
          islandPath,
          propIds,
          slots: { default: htmlWithoutPropComments },
        },
      })

      return toSsrComment(islandId)
    },
  )

  eleventyConfig.addPairedShortcode(
    'island',
    function (htmlWithPropComments, unresolvedIslandPath, ...loadConditions) {
      const { inputPath } = this.page
      const renderer = extToRendererMap.get(toIslandExt(unresolvedIslandPath))
      if (typeof renderer?.clientEntrypoint !== 'string') {
        throw new Error(
          `No client renderer found for ${JSON.stringify(unresolvedIslandPath)} in ${JSON.stringify(
            inputPath,
          )}! Please add a renderer to your Slinkity plugin config. See https://slinkity.dev/docs/component-shortcodes/#prerequisites for more.`,
        )
      }
      const islandId = uuidv4()
      const islandPath = toResolvedIslandPath(unresolvedIslandPath, userConfig.islandsDir)
      const clientPropsPath = toClientPropsPathFromOutputPath(
        this.page.outputPath,
        eleventyConfig.dir.output,
      )
      const { htmlWithoutPropComments, propIds } = extractPropIdsFromHtml(htmlWithPropComments)
      const existingSsrComponents = ssrIslandsByInputPath.get(inputPath)
      ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrComponents,
        [islandId]: {
          islandPath,
          propIds,
          slots: { default: htmlWithoutPropComments },
        },
      })

      return toClientScript({
        isClientOnly: false,
        islandId,
        islandPath,
        loadConditions,
        clientPropsPath,
        clientRendererPath: renderer.clientEntrypoint,
        propIds,
      })
    },
  )

  eleventyConfig.addPairedShortcode(
    'clientOnlyIsland',
    function (htmlWithPropComments, unresolvedIslandPath, ...loadConditions) {
      const { inputPath } = this.page
      const renderer = extToRendererMap.get(toIslandExt(unresolvedIslandPath))
      if (typeof renderer?.clientEntrypoint !== 'string') {
        throw new Error(
          `No client renderer found for ${JSON.stringify(unresolvedIslandPath)} in ${JSON.stringify(
            inputPath,
          )}! Please add a renderer to your Slinkity plugin config. See https://slinkity.dev/docs/component-shortcodes/#prerequisites for more.`,
        )
      }
      const islandId = uuidv4()
      const islandPath = toResolvedIslandPath(unresolvedIslandPath, userConfig.islandsDir)
      const clientPropsPath = toClientPropsPathFromOutputPath(
        this.page.outputPath,
        eleventyConfig.dir.output,
      )
      const { propIds } = extractPropIdsFromHtml(htmlWithPropComments)

      return toClientScript({
        isClientOnly: true,
        islandId,
        islandPath,
        loadConditions,
        clientPropsPath,
        clientRendererPath: renderer.clientEntrypoint,
        propIds,
      })
    },
  )

  eleventyConfig.addShortcode('prop', function (name, value) {
    const { inputPath } = this.page
    let serializedValue, id
    let hasStore = Boolean(propsByInputPath.get(inputPath)?.hasStore)
    if (typeof value === 'object' && value !== null && value.isSlinkityStoreFactory) {
      serializedValue = `new SlinkityStore(${devalue(value.value)})`
      id = value.id
      hasStore = true
    } else {
      serializedValue = devalue(value)
      id = uuidv5(`${name}${serializedValue}`, BUILD_ID)
    }
    const existingPropsOnPage = propsByInputPath.get(inputPath)?.props ?? {}
    propsByInputPath.set(inputPath, {
      hasStore,
      props: {
        ...existingPropsOnPage,
        [id]: { name, value, serializedValue },
      },
    })

    return toPropComment(id)
  })
}
