const { join, relative } = require('path')
const toCommonJSModule = require('./toCommonJSModule')
const addShortcode = require('./addShortcode')
const toRendererHtml = require('./toRendererHtml')
const toFormattedDataForProps = require('./toFormattedDataForProps')
const { toHydrationLoadersApplied } = require('./toHydrationLoadersApplied')
const { toComponentAttrStore } = require('./componentAttrStore')

module.exports = function reactPlugin(eleventyConfig, { dir }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  const componentAttrStore = toComponentAttrStore()

  addShortcode(eleventyConfig, { componentAttrStore, dir })

  eleventyConfig.on('beforeBuild', () => {
    componentAttrStore.clear()
  })

  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: async (inputPath) => {
      const { frontMatter = {} } = await toCommonJSModule({
        inputPath,
        shouldHaveDefaultExport: false,
      })
      return frontMatter
    },
    compile: (_, inputPath) =>
      async function (data) {
        const jsxImportPath = relative(dir.input, inputPath)

        // TODO: make this more efficient with caching
        // We already build the component in getData!
        // See https://github.com/11ty/eleventy-plugin-vue/blob/master/.eleventy.js
        const {
          default: Component = () => null,
          getProps = () => ({}),
          frontMatter = {},
          __stylesGenerated,
        } = await toCommonJSModule({ inputPath })

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
          styles: __stylesGenerated,
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
