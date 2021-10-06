const { toMountPoint } = require('./toRendererHtml')
const toFormattedDataForProps = require('./toFormattedDataForProps')
const { relative } = require('path')

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
      const { frontMatter } = await viteSSR.toComponentCommonJSModule(inputPath)
      return frontMatter
    },
    compile: (_, inputPath) =>
      async function (data) {
        const jsxImportPath = relative(dir.input, inputPath)

        const { getProps, frontMatter } = await viteSSR.toComponentCommonJSModule(inputPath)

        const props = await getProps(
          toFormattedDataForProps({
            ...data,
            shortcodes: eleventyConfig.javascriptFunctions ?? {},
          }),
        )
        const hydrate = frontMatter.render ?? 'eager'
        const id = componentAttrStore.push({
          path: jsxImportPath,
          props,
          styleToFilePathMap: {},
          hydrate,
          pageInputPath: inputPath,
        })

        return toMountPoint({ id, hydrate })
      },
  })
}
