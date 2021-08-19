const { readFile } = require('fs').promises
const { writeFileRec } = require('../../utils/fileHelpers')
const toCommonJSModule = require('./toCommonJSModule')
const { join, relative, sep } = require('path')
const cheerio = require('cheerio')
const addShortcode = require('./addShortcode')
const { stringify } = require('javascript-stringify')
const toRendererHtml = require('./toRendererHtml')
const htmlEscape = require('../../utils/htmlEscape')
const toFormattedDataForProps = require('./toFormattedDataForProps')

const SLINKITY_REACT_RENDERER_PATH =
  'slinkity/lib/plugin/reactPlugin/_slinkity-react-renderer.js'

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
        const { default: Component = () => null, getProps = () => ({}), frontMatter = {} } =
          await toCommonJSModule({ inputPath })

        const props = await getProps(toFormattedDataForProps({
          ...data,
          shortcodes: eleventyConfig.javascriptFunctions ?? {}
        }))
        componentToPropsMap[jsxImportPath] = props

        return toRendererHtml({
          Component,
          componentPath: jsxImportPath,
          props,
          render: frontMatter.render ?? 'eager',
          isPage: true,
          innerHTML: data.content,
        })
      },
  })

  eleventyConfig.addTransform(
    'add-react-renderer-script',
    async function (content, outputPath) {
      if (!outputPath.endsWith('.html')) return content

      const $ = cheerio.load(content)
      const hasDynamicReact = $('slinkity-react-renderer').length > 0

      if (hasDynamicReact) {
        const rendererAttrs = $('slinkity-react-renderer')
          .toArray()
          .map((el) => el.attribs)

        await Promise.all(
          rendererAttrs.map(async ({ 'data-s-path': componentPath }) => {
            const jsxInputPath = join(dir.input, componentPath)
            const jsxOutputPath = join(dir.output, componentPath)
            await writeFileRec(jsxOutputPath, await readFile(jsxInputPath))
          })
        )

        const componentScripts = rendererAttrs.map(
          ({ 'data-s-path': componentPath, 'data-s-lazy': isLazy = false }) => {
            const loadScript = `<script type="module">
            import { renderComponent } from ${JSON.stringify(SLINKITY_REACT_RENDERER_PATH)};
            import Component from ${JSON.stringify('/' + componentPath.split(sep).join('/'))};
            const props = ${stringify(componentToPropsMap[componentPath] ?? {})}; 
            renderComponent({ Component, componentPath: ${JSON.stringify(componentPath)}, props });
          </script>`
            if (isLazy) {
              // wrap "lazy" components in a template so we can load them later
              return `<template data-s-path="${htmlEscape(
                componentPath
              )}">${loadScript}</template>`
            } else {
              return loadScript
            }
          }
        )

        $('body').append(
          `<script type="module" async>
            import SlinkityReactRenderer from ${JSON.stringify(SLINKITY_REACT_RENDERER_PATH)};
            window.customElements.define('slinkity-react-renderer', SlinkityReactRenderer);
          </script>
          ${componentScripts.join('')}`
        )
        return $.html()
      } else {
        return content
      }
    }
  )
}
