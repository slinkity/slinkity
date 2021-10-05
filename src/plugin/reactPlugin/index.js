const { join, relative } = require('path')
const toSlashesTrimmed = require('../../utils/toSlashesTrimmed')
const { addPageExtension, addShortcode } = require('./1-pluginDefinitions')
const { toHydrationLoadersApplied } = require('./2-pageTransform')

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @typedef ReactPluginOptions
 * @property {import('..').PluginOptions['dir']} dir
 * @property {import('..').PluginOptions['viteSSR']} viteSSR
 * @property {Record<string, Object>} urlToCompiledHtmlMap
 * @property {import('../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @param {ReactPluginOptions} options - all React plugin options
 */
module.exports = function reactPlugin(
  eleventyConfig,
  { dir, viteSSR, urlToCompiledHtmlMap, componentAttrStore },
) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  addPageExtension(eleventyConfig, { componentAttrStore, dir, viteSSR })
  addShortcode(eleventyConfig, { componentAttrStore, dir })

  eleventyConfig.addTransform(
    'apply-react-hydration-loaders',
    async function (content, outputPath) {
      if (!outputPath.endsWith('.html')) return content
      const componentAttrs = componentAttrStore.getAllByPage(this.inputPath)

      const formattedAsUrl = toSlashesTrimmed(
        relative(dir.output, outputPath)
          .replace(/.html$/, '')
          .replace(/index$/, ''),
      )

      const withHydrationLoadersApplied = await toHydrationLoadersApplied({
        content,
        componentAttrs,
        dir,
      })

      urlToCompiledHtmlMap[formattedAsUrl] = {
        outputPath: '/' + toSlashesTrimmed(relative(dir.output, outputPath)),
        content: withHydrationLoadersApplied,
      }
      console.log({ formattedAsUrl })
      return withHydrationLoadersApplied
    },
  )
}
