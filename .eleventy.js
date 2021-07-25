const { readFile, writeFile } = require('fs/promises')

module.exports = function config(eleventyConfig) {
  eleventyConfig.addTemplateFormats('jsx')
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
