const { join, relative } = require('path')
const toCommonJSModule = require('./toCommonJSModule')
const addShortcode = require('./addShortcode')
const toRendererHtml = require('./toRendererHtml')
const toFormattedDataForProps = require('./toFormattedDataForProps')
const { toHydrationLoadersApplied } = require('./toHydrationLoadersApplied')

module.exports = function reactPlugin(eleventyConfig, { dir }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  const componentToPropsMap = {}

  addShortcode(eleventyConfig, { componentToPropsMap, dir })

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
        } = await toCommonJSModule({ inputPath })

        const props = await getProps(
          toFormattedDataForProps({
            ...data,
            shortcodes: eleventyConfig.javascriptFunctions ?? {},
          }),
        )
        componentToPropsMap[jsxImportPath] = props

        return toRendererHtml({
          Component,
          componentPath: jsxImportPath,
          props,
          render: frontMatter.render ?? 'eager',
          innerHTML: data.content,
        })
      },
  })

  eleventyConfig.addTransform('add-react-renderer-script', async function (content, outputPath) {
    if (!outputPath.endsWith('.html')) return content

    return await toHydrationLoadersApplied({ content, componentToPropsMap, dir })
  })
}
