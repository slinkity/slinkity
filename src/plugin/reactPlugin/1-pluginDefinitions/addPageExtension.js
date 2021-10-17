const { toMountPoint } = require('./toMountPoint')
const toFormattedDataForProps = require('./toFormattedDataForProps')
const { relative, join } = require('path')
const { writeFileRec } = require('../../../utils/fileHelpers')
const { readFile } = require('fs/promises')

/**
 * @param {object} eleventyConfig
 * @typedef AddPageExtParams
 * @property {import('../../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../../index').SlinkityConfigOptions['dir']} dir
 * @property {import('../../../cli/toViteSSR').ViteSSR} viteSSR
 * @param {AddPageExtParams}
 */
module.exports = function addPageExtension(eleventyConfig, { componentAttrStore, dir, viteSSR }) {
  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: async (inputPath) => {
      // TODO: ditch the passthrough copy to output and read directly from input
      const relativePath = relative(dir.input, inputPath)
      const outputPath = join(dir.output, relativePath)
      await writeFileRec(outputPath, await readFile(inputPath))
      const { frontMatter } = await viteSSR.toComponentCommonJSModule(relativePath)
      return frontMatter
    },
    compile: (_, inputPath) =>
      async function (data) {
        const relativePath = relative(dir.input, inputPath)
        const { getProps, frontMatter } = await viteSSR.toComponentCommonJSModule(relativePath)

        const props = await getProps(
          toFormattedDataForProps({
            ...data,
            shortcodes: eleventyConfig.javascriptFunctions ?? {},
          }),
        )
        const hydrate = frontMatter.render ?? 'eager'
        const id = componentAttrStore.push({
          path: relativePath,
          props,
          styleToFilePathMap: {},
          hydrate,
          pageOutputPath: data.page.outputPath,
        })

        return toMountPoint({ id, hydrate })
      },
  })
}
