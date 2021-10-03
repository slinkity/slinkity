const toRendererHtml = require('./toRendererHtml')
const toFormattedDataForProps = require('./toFormattedDataForProps')
const { relative } = require('path')

/**
 * @param {object} eleventyConfig
 * @typedef AddPageExtParams
 * @property {import('../2-pageTransform/componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../../index').PluginOptions['dir']} dir
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

        const {
          default: Component,
          getProps,
          frontMatter,
          __stylesGenerated,
        } = await viteSSR.toComponentCommonJSModule(inputPath)

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
          styleToFilePathMap: __stylesGenerated,
          hydrate,
          pageInputPath: inputPath,
        })

        return toRendererHtml({
          Component,
          componentPath: jsxImportPath,
          props,
          id,
          render: hydrate,
          innerHTML: data.content,
        })
      },
  })
}
