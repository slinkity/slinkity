const { readFile } = require('fs').promises
const { writeFileRec } = require('../../utils/fileHelpers')
const toCommonJSModule = require('./toCommonJSModule')
const { join, relative } = require('path')
const cheerio = require('cheerio')
const addShortcode = require('./addShortcode')
const { stringify } = require('javascript-stringify')
const toRendererHtml = require('./toRendererHtml')

module.exports = function reactPlugin(eleventyConfig, { dir }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  const componentToPropsMap = {}

  eleventyConfig.addPlugin(addShortcode, { componentToPropsMap })

  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: async (inputPath) => {
      const { getProps = () => ({}) } = await toCommonJSModule({ inputPath })
      return getProps({})
    },
    compile: (_, inputPath) =>
      async function (data) {
        const jsxImportPath = relative(dir.input, inputPath)

        // TODO: make this more efficient with caching
        // We already build the component in getData!
        // See https://github.com/11ty/eleventy-plugin-vue/blob/master/.eleventy.js
        const { default: Component = () => {}, getProps = () => ({}) } =
          await toCommonJSModule({ inputPath })

        const props = getProps(data)
        componentToPropsMap[jsxImportPath] = props

        return toRendererHtml({
          Component,
          componentPath: jsxImportPath,
          props,
          render: props.render,
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
            const jsxInputPath = join(process.cwd(), dir.input, componentPath)
            const jsxOutputPath = join(process.cwd(), dir.output, componentPath)
            await writeFileRec(jsxOutputPath, await readFile(jsxInputPath))
          })
        )

        const componentScripts = rendererAttrs.map(
          ({ 'data-s-path': componentPath, 'data-s-lazy': isLazy = false }) => {
            const loadScript = `<script type="module">
            import { renderComponent } from 'slinkity/lib/plugins/reactPlugin/_slinkity-react-renderer.js';
            import Component from '/${componentPath}';
            const props = ${stringify(
              componentToPropsMap[componentPath] ?? {}
            )}; 
            renderComponent({ Component, componentPath: '${componentPath}', props });
          </script>`
            if (isLazy) {
              // wrap "lazy" components in a template so we can load them later
              return `<template data-s-path=${componentPath}>${loadScript}</template>`
            } else {
              return loadScript
            }
          }
        )

        $('body').append(
          `<script type="module" async>
            import SlinkityReactRenderer from 'slinkity/lib/plugins/reactPlugin/_slinkity-react-renderer.js';
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
