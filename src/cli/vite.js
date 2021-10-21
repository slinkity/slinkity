const vite = require('vite')
const { resolve } = require('path')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const { resolveConfigFilePath } = require('../utils/resolveConfigFilePath')

function getConfigFile() {
  return resolveConfigFilePath(['js', 'mjs', 'ts'].map((ext) => `vite.config.${ext}`))
}

async function serve({ input, port }) {
  // TODO: allow user vite.config to override these settings
  // Currently *our* settings override any *user* settings
  const configFile = await getConfigFile()

  const options = {
    configFile: configFile,
    root: resolve(input),
    clearScreen: false,
  }
  if (port) {
    options.port = port
  }

  const server = await vite.createServer(options)
  await server.listen()
}

async function build({ input, output }) {
  const inputFiles = await glob(`${input}/**/*.html`, { absolute: true })
  if (inputFiles.length) {
    await vite.build({
      root: input,
      configFile: await getConfigFile(),
      build: {
        outDir: output,
        emptyOutDir: true,
        rollupOptions: {
          input: inputFiles,
          output: {
            manualChunks: {
              react: ['react'],
            },
          },
        },
      },
    })
  }
}

module.exports = { serve, build, getConfigFile }
