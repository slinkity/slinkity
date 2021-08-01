const React = require('react')
const { readFile } = require('fs/promises')
const { writeFileRec } = require('../../fileHelpers')
const { renderToString } = require('react-dom/server')
const { toCommonJSModule } = require('./toCommonJSModule')
const { join } = require('path')

module.exports = function reactPlugin(eleventyConfig, { dir }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, dir.includes, '**.jsx'))

  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: () => ({}),
    compile: (_, inputPath) =>
      async function (data) {
        const jsxOutputPath = data.page.outputPath.replace(/\.html$/, '.jsx')
        const jsxImportPath = jsxOutputPath
          .replace(new RegExp(`^${dir.output}`), '')
          .replace(/jsx$/, 'js')

        await writeFileRec(jsxOutputPath, await readFile(inputPath))
        const component = await toCommonJSModule(inputPath)

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
}
