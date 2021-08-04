const React = require('react')
const { readFile } = require('fs/promises')
const { writeFileRec } = require('../../fileHelpers')
const { renderToString } = require('react-dom/server')
const { toCommonJSModule } = require('./toCommonJSModule')
const { join, relative } = require('path')

module.exports = function reactPlugin(eleventyConfig, { dir }) {
  eleventyConfig.addTemplateFormats('jsx')
  eleventyConfig.addPassthroughCopy(join(dir.input, '_includes', 'components'))

  eleventyConfig.addExtension('jsx', {
    read: false,
    getData: () => ({}),
    compile: (_, inputPath) =>
      async function (data) {
        const jsxImportPath = relative(dir.input, inputPath)
        const jsxOutputPath = join(dir.output, jsxImportPath)

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
        import Component from '/${jsxImportPath}'

        ReactDOM.render(React.createElement(Component), document.getElementById('${jsxOutputPath}'))
      </script>
    `
      },
  })
}
