const vite = require('vite')
const { join } = require('path')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const { resolveConfigFilePath } = require('../utils/resolveConfigFilePath')
const { IMPORT_ALIASES } = require('../utils/consts')

function getConfigFile() {
  return resolveConfigFilePath(['js', 'mjs', 'ts'].map((ext) => `vite.config.${ext}`))
}

/**
 * @typedef {import('../utils/consts').ImportAliases} ImportAliases
 * @typedef {Record<keyof import('../utils/consts').ImportAliases, string>} ResolvedImportAliases
 * @param {import('../plugin/index').SlinkityConfigOptions['dir']} dir
 * @returns {ResolvedImportAliases}
 */
function getResolvedAliases(dir) {
  return {
    root: join(process.cwd()),
    input: join(process.cwd(), dir.input),
    includes: join(process.cwd(), dir.input, dir.includes),
    layouts: join(process.cwd(), dir.input, dir.layouts),
  }
}

/**
 * Get Vite config shared by dev and production
 * @param {import('../plugin/index').SlinkityConfigOptions['dir']} dir
 * @returns {import('vite').UserConfigExport}
 */
async function getSharedConfig(dir) {
  const importAliasesToResolvedPath = Object.entries(getResolvedAliases(dir)).map(
    ([key, value]) => [IMPORT_ALIASES[key], value],
  )
  return vite.defineConfig({
    clearScreen: false,
    configFile: await getConfigFile(),
    resolve: {
      alias: Object.fromEntries(importAliasesToResolvedPath),
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
    },
  })
}

/**
 * Build production bundle
 * @param {import('../plugin/index').SlinkityConfigOptions['dir']} dir
 */
async function build(dir) {
  const inputFiles = await glob(`${dir.input}/**/*.html`, { absolute: true })

  if (inputFiles.length) {
    await vite.build({
      ...(await getSharedConfig(dir)),
      root: dir.input,
      build: {
        outDir: dir.output,
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

module.exports = { build, getConfigFile, getSharedConfig, getResolvedAliases }
