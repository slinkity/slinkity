const { join, relative } = require('path')
const addShortcode = require('./addShortcode')
const toRendererHtml = require('./toRendererHtml')
const toFormattedDataForProps = require('./toFormattedDataForProps')
const { toHydrationLoadersApplied } = require('./toHydrationLoadersApplied')
const { toComponentAttrStore } = require('./componentAttrStore')

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @param {import('..').PluginOptions} options - all Slinkity plugin options
 */
module.exports = function reactPlugin(eleventyConfig, { dir, viteSSR }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  const componentAttrStore = toComponentAttrStore()

  addShortcode(eleventyConfig, { componentAttrStore, dir, viteSSR })

  eleventyConfig.on('beforeBuild', () => {
    componentAttrStore.clear()
  })

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

  eleventyConfig.addTransform('add-react-renderer-script', async function (content, outputPath) {
    if (!outputPath.endsWith('.html')) return content

    return await toHydrationLoadersApplied({ content, componentAttrStore, dir })
  })
}
