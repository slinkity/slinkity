const React = require('react')
const { readFile } = require('fs/promises')
const { writeFileRec } = require('../../utils/fileHelpers')
const { renderToString } = require('react-dom/server')
const { toCommonJSModule } = require('./toCommonJSModule')
const { join, relative } = require('path')
const cheerio = require('cheerio')
const parseHtmlToReact = require('html-react-parser')

module.exports = function reactPlugin(eleventyConfig, { dir }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: async (inputPath) => {
      const { getProps = () => ({}) } = await toCommonJSModule(inputPath)
      return getProps({})
    },
    compile: (_, inputPath) =>
      async function (data) {
        const jsxImportPath = relative(dir.input, inputPath)

        // TODO: make this more efficient with caching
        // We already build the component in getData!
        // See https://github.com/11ty/eleventy-plugin-vue/blob/master/.eleventy.js
        const { default: component, getProps = () => ({}) } =
          await toCommonJSModule(inputPath)

        if (component == null) {
          console.error(
            `Looks like you forgot to export default from your .jsx file: ${inputPath}`
          )
          return ''
        }

        const props = getProps(data)

        const elementAsHTMLString = renderToString(
          React.createElement(
            component,
            props,
            parseHtmlToReact(data.content || '')
          )
        )

        if (props.render === 'static') {
          return elementAsHTMLString
        } else {
          const isLazy = props.render === 'lazy'
          return `
        <slinkity-react-renderer data-s-path="${jsxImportPath}" data-s-page="true"
        ${isLazy ? 'data-s-lazy="true"' : ''}>
          ${elementAsHTMLString}
        </slinkity-react-renderer>
        `
        }
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

        // TODO: handle component props, children
        const componentScripts = rendererAttrs.map(
          ({ 'data-s-path': componentPath, 'data-s-lazy': isLazy = false }) => {
            const loadScript = `<script type="module">
            import { renderComponent } from 'slinkity/lib/plugins/reactPlugin/_slinkity-react-renderer.js'
            import Component from '/${componentPath}'

            renderComponent({ Component, componentPath: '${componentPath}' })
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
            import SlinkityReactRenderer from 'slinkity/lib/plugins/reactPlugin/_slinkity-react-renderer.js'
            window.customElements.define('slinkity-react-renderer', SlinkityReactRenderer)
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
