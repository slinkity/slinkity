const vite = require('vite')
const { resolve } = require('path')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const { readFile } = require('fs').promises

export async function getConfigFile() {
  for (const ext of ['js', 'mjs', 'ts']) {
    try {
      const path = resolve(`vite.config.${ext}`)
      await readFile(path)
      return path
    } catch {
      /* if this fails, try the next ext */
    }
  }

  return false
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

module.exports = { serve, build }
