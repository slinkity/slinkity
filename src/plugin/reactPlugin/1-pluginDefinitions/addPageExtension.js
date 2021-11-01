const { toMountPoint } = require('./toMountPoint')
const toFormattedDataForProps = require('./toFormattedDataForProps')
const { join } = require('path')

/**
 * @param {object} eleventyConfig
 * @typedef AddPageExtParams
 * @property {import('../../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../../../cli/toViteSSR').ViteSSR} viteSSR
 * @property {import('../../../cli/vite').ResolvedImportAliases} resolvedImportAliases
 * @param {AddPageExtParams}
 */
module.exports = function addPageExtension(
  eleventyConfig,
  { componentAttrStore, viteSSR, resolvedImportAliases },
) {
  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: async (inputPath) => {
      const absInputPath = join(resolvedImportAliases.root, inputPath)
      const { frontMatter } = await viteSSR.toComponentCommonJSModule(absInputPath)
      return frontMatter
    },
    compile: (_, inputPath) =>
      async function (data) {
        const absInputPath = join(resolvedImportAliases.root, inputPath)
        const { getProps, frontMatter } = await viteSSR.toComponentCommonJSModule(absInputPath)

        const props = await getProps(
          toFormattedDataForProps({
            ...data,
            shortcodes: eleventyConfig.javascriptFunctions ?? {},
          }),
        )
        const hydrate = frontMatter.render ?? 'eager'
        const id = componentAttrStore.push({
          path: absInputPath,
          props,
          styleToFilePathMap: {},
          hydrate,
          pageOutputPath: data.page.outputPath,
        })

        return toMountPoint({ id, hydrate })
      },
  })
}
