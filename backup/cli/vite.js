const vite = require('vite')
const { resolve } = require('path')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const { readFile } = require('fs').promises
const fs = require('fs')

async function getConfigFile() {
  try {
    const path = resolve(process.cwd(), 'vite.config.js')
    const contents = (await readFile(path)).toString()
    return { path, contents }
  } catch {}
  try {
    const path = resolve(process.cwd(), 'vite.config.mjs')
    const contents = (await readFile(path)).toString()
    return { path, contents }
  } catch {
    console.log('No vite config file found. Using defaults')
  }
  return { path: false }
}

async function serve({ input }) {
  const configFile = await getConfigFile()
  const server = await vite.createServer({
    configFile: configFile.path,
    root: resolve(process.cwd(), input),
    clearScreen: false,
  })
  await server.listen()
}

async function build({ input, output }) {
  const inputFiles = await glob(`${input}/**/*.html`, { absolute: true })
  if (inputFiles.length) {
    await vite.build({
      root: input,
      configFile: (await getConfigFile()).path,
      build: {
        outDir: output,
        emptyOutDir: true,
        rollupOptions: {
          input: inputFiles,
        },
      },
    })
  }
}

module.exports = { serve, build }
