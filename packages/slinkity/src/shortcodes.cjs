const devalue = require('devalue')
const { v4: uuidv4, v5: uuidv5 } = require('uuid')
const {
  toSsrComment,
  toPropComment,
  toResolvedIslandPath,
  extractPropIdsFromHtml,
} = require('./utils.cjs')
const { BUILD_ID } = require('./consts.cjs')

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
 * @param {import('./@types').UserConfig} unresolvedUserConfig
 * @param {Pick<import('./@types').PluginGlobals, 'ssrIslandsByInputPath' | 'propsByInputPath'>} pluginGlobals
 */
module.exports = function shortcodes(
  eleventyConfig,
  userConfig,
  { ssrIslandsByInputPath, propsByInputPath },
) {
  eleventyConfig.addPairedShortcode(
    'serverOnlyIsland',
    function (htmlWithPropComments, unresolvedIslandPath) {
      const islandPath = toResolvedIslandPath(unresolvedIslandPath, userConfig.islandsDir)
      const islandId = uuidv4()

      const { htmlWithoutPropComments: html, propIds } =
        extractPropIdsFromHtml(htmlWithPropComments)

      const { inputPath } = this.page
      const existingSsrComponents = ssrIslandsByInputPath.get(inputPath)
      ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrComponents,
        [islandId]: {
          islandPath,
          propIds,
          slots: { default: html },
        },
      })

      return toSsrComment(islandId)
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
