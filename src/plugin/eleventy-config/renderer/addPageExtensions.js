const { toMountPoint } = require('./toMountPoint')
const toFormattedDataForProps = require('../toFormattedDataForProps')
const { join } = require('path')

/**
 * @param {object} eleventyConfig
 * @typedef AddPageExtParams
 * @property {import('../../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../../../cli/toViteSSR').ViteSSR} viteSSR
 * @property {import('../../../cli/vite').ResolvedImportAliases} resolvedImportAliases
 * @property {import('../../../main/defineConfig').Renderer} renderer
 * @param {AddPageExtParams}
 */
module.exports.addPageExtensions = function (
  eleventyConfig,
  { componentAttrStore, viteSSR, resolvedImportAliases, renderer },
) {
  let useCache = false
  for (const extension of renderer.extensions) {
    eleventyConfig.addExtension(extension, {
      read: false,
      async getData(inputPath) {
        const absInputPath = join(resolvedImportAliases.root, inputPath)
        const loadedModule = await viteSSR.toCommonJSModule(absInputPath, { useCache })
        useCache = true
        return await renderer
          .page({ loadedModule, eleventyConfig, extension })
          .getData(loadedModule)
      },
      compile(_, inputPath) {
        return async function render(data) {
          const absInputPath = join(resolvedImportAliases.root, inputPath)
          const loadedModule = await viteSSR.toCommonJSModule(absInputPath, { useCache })
          const { getProps, getHydrationMode, useFormatted11tyData } = await renderer.page({
            loadedModule,
            eleventyConfig,
            extension,
          })

          const formattedData = useFormatted11tyData ? toFormattedDataForProps(data) : data
          const props = await getProps(formattedData)
          const hydrate = await getHydrationMode(data)

          const id = componentAttrStore.push({
            path: absInputPath,
            props,
            styleToFilePathMap: {},
            hydrate,
            pageOutputPath: data.page.outputPath,
            rendererName: renderer.name,
          })

          return toMountPoint({ id, hydrate })
        }
      },
    })
  }
  eleventyConfig.on('afterBuild', () => {
    // use caching for the duration of the build, and invalidate when the build is complete
    useCache = false
  })
}
