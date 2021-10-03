const { join } = require('path')
const { addPageExtension, addShortcode } = require('./1-pluginDefinitions')
const { toHydrationLoadersApplied, toComponentAttrStore } = require('./2-pageTransform')

/**
 * @param {Object} eleventyConfig - config passed down by Eleventy
 * @param {import('..').PluginOptions} options - all Slinkity plugin options
 */
module.exports = function reactPlugin(eleventyConfig, { dir, viteSSR }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  const componentAttrStore = toComponentAttrStore()

  eleventyConfig.on('beforeBuild', () => {
    componentAttrStore.clear()
  })

  addPageExtension(eleventyConfig, { componentAttrStore, dir, viteSSR })
  addShortcode(eleventyConfig, { componentAttrStore, dir, viteSSR })

  eleventyConfig.addTransform(
    'apply-react-hydration-loaders',
    async function (content, outputPath) {
      if (!outputPath.endsWith('.html')) return content
      const componentAttrs = componentAttrStore.getAllByPage(this.inputPath)

      return await toHydrationLoadersApplied({
        content,
        componentAttrs,
        dir,
      })
    },
  )
}
