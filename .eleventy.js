const { readFile } = require('fs/promises')
const { promisify } = require('util')
const sass = require('sass')
const sassRender = promisify(sass.render)
const { writeFileRec } = require('./utils/fileHelpers')
const requireFromString = require('require-from-string')
const { build } = require('esbuild')
const { renderToString } = require('react-dom/server')
const React = require('react')

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, (args) => ({ path: args.path, external: true }))
  },
}

const getCommonJSModule = async (inputPath = '') => {
  const { outputFiles } = await build({
    entryPoints: [inputPath],
    format: 'cjs',
    bundle: true,
    plugins: [makeAllPackagesExternalPlugin],
    write: false,
  })
  const { text } = outputFiles[0]
  return requireFromString(text, inputPath)
}

module.exports = function config(eleventyConfig) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addTemplateFormats('scss')
  eleventyConfig.addPassthroughCopy('components')

  eleventyConfig.addExtension('scss', {
    read: false,
    outputFileExtension: 'css',
    getData: () => ({ layout: '' }),
    compile: (_, inputPath) => async (data) => {
      const { css } = await sassRender({ file: inputPath })
      return css
    },
  })

  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: () => ({}),
    compile: (_, inputPath) =>
      async function (data) {
        const jsxOutputPath = data.page.outputPath.replace(/\.html$/, '.jsx')
        const jsxImportPath = jsxOutputPath
          .replace(/^_site/, '')
          .replace(/jsx$/, 'js')

        await writeFileRec(jsxOutputPath, await readFile(inputPath))
        const component = await getCommonJSModule(jsxOutputPath)

        const elementAsHTMLString = renderToString(
          React.createElement(component.default, {})
        )

        return `
        <div id="${jsxOutputPath}">${elementAsHTMLString}</div>
        <script type="module">
          import ReactDOM from 'react-dom'
          import React from 'react'
          import Component from '${jsxImportPath}'

          ReactDOM.render(React.createElement(Component), document.getElementById('${jsxOutputPath}'))
        </script>
      `
      },
  })

  return {
    dir: {
      input: 'src',
    },
  }
}
