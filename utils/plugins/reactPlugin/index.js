const React = require('react')
const { readFile } = require('fs/promises')
const { writeFileRec } = require('../../fileHelpers')
const { renderToString } = require('react-dom/server')
const { toCommonJSModule } = require('./toCommonJSModule')
const { join, relative } = require('path')
const cheerio = require('cheerio')

const REACT_RENDERER_FILE_NAME = '_slinkity-react-renderer.js'

module.exports = function reactPlugin(eleventyConfig, { dir }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, 'components'))

  // TODO: remove this once we can directly import from node_modules
  let reactRendererAddedToBuild = false
  const addReactRendererToBuild = async () => {
    // don't repeatedly read / write the _slinkity-react-renderer
    // during production builds
    if (reactRendererAddedToBuild) return

    const reactRenderer = await readFile(
      join(__dirname, REACT_RENDERER_FILE_NAME)
    )
    await writeFileRec(
      join(dir.output, REACT_RENDERER_FILE_NAME),
      reactRenderer
    )

    reactRendererAddedToBuild = true
  }

  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: async (inputPath) => {
      const { data } = await toCommonJSModule(inputPath)
      return data
    },
    compile: (_, inputPath) =>
      async function (data) {
        const jsxImportPath = relative(dir.input, inputPath)

        // TODO: make this more efficient with caching
        // We already build the component in getData!
        // See https://github.com/11ty/eleventy-plugin-vue/blob/master/.eleventy.js
        const { default: component, data: frontMatterData = {} } =
          await toCommonJSModule(inputPath)

        if (component == null) {
          console.error(
            `Looks like you forgot to export default from your .jsx file: ${inputPath}`
          )
          return ''
        }

        const elementAsHTMLString = renderToString(
          React.createElement(component, {})
        )

        if (frontMatterData.render === 'static') {
          return elementAsHTMLString
        } else {
          const isLazy = frontMatterData.render === 'lazy'
          return `
        <slinkity-react-renderer data-s-path="${jsxImportPath}"
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
        addReactRendererToBuild()

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
            import ReactDOM from 'react-dom'
            import React from 'react'
            import Component from '/${componentPath}'
    
            ReactDOM.render(React.createElement(Component),
            document.querySelector('slinkity-react-renderer[data-s-path="${componentPath}"]'))
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
          `<script type="module" src="/_slinkity-react-renderer.js" async></script>
          ${componentScripts.join('')}`
        )
        return $.html()
      } else {
        return content
      }
    }
  )
}
