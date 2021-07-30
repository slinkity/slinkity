const { readFile, writeFile } = require('fs/promises')
const { promisify } = require('util')
const { join } = require('path')
const sass = require('sass')
const sassRender = promisify(sass.render)
const { writeFileRec } = require('./utils/fileHelpers')
const requireFromString = require('require-from-string')
const { build } = require('esbuild')
const { renderToString } = require('react-dom/server')
const React = require('react')
const { startServer, createConfiguration } = require('snowpack')
const { isPortInUse } = require('./utils/isPortInUse')

// TODO: replace _site with user configuration
const SNOWPACK_PORT_PATH = join(process.cwd(), '_site', '.snowpack-port')

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

const getSnowpackPort = async () => {
  try {
    return Number((await readFile(SNOWPACK_PORT_PATH)).toString())
  } catch (e) {
    return undefined
  }
}

module.exports = function config(eleventyConfig) {
  let snowpackServer = null
  const mode = process.argv.includes('--watch') ? 'development' : 'production'
  const snowpackConfig = createConfiguration({
    root: join(process.cwd(), '_site'),
    mode,
  })

  eleventyConfig.on('beforeBuild', async () => {
    if (snowpackServer) return

    const snowpackPort = await getSnowpackPort()
    if (snowpackPort != null && (await isPortInUse(snowpackPort))) return

    snowpackServer = await startServer({
      config: snowpackConfig,
    })

    await writeFile(SNOWPACK_PORT_PATH, `${snowpackServer.port}`)
  })

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
