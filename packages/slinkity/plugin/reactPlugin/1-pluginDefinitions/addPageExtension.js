const toFormattedDataForProps = require('./toFormattedDataForProps')
const { join } = require('path')
const { toSSRComment } = require('../../../utils/consts')

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
  let useCache = false
  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: async (inputPath) => {
      const absInputPath = join(resolvedImportAliases.root, inputPath)
      useCache = true
      const { frontMatter } = await viteSSR.toCommonJSModule(absInputPath, { useCache })
      return frontMatter
    },
    compile: (_, inputPath) =>
      async function (data) {
        const absInputPath = join(resolvedImportAliases.root, inputPath)
        const { getProps, frontMatter } = await viteSSR.toCommonJSModule(absInputPath, {
          useCache,
        })

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

        return toSSRComment(id)
      },
  })

  eleventyConfig.on('afterBuild', () => {
    // use caching for the duration of the build, and invalidate when the build is complete
    useCache = false
  })
}
