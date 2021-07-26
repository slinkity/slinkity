const { readFile, writeFile } = require('fs/promises')
const { promisify } = require('util')
const sass = require('sass')
const sassRender = promisify(sass.render)

module.exports = function config(eleventyConfig) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addTemplateFormats('scss')

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

        await writeFile(jsxOutputPath, await readFile(inputPath))

        return `
        <div id="${jsxOutputPath}"></div>
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
