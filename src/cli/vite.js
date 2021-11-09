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
function getResolvedAliases({ input, includes, layouts }) {
  return {
    root: join(process.cwd()),
    input: join(process.cwd(), input),
    includes: join(process.cwd(), input, includes),
    layouts: join(process.cwd(), input, layouts),
  }
}

/**
 * Get Vite config shared by dev and production
 * @param {import('../plugin/index').SlinkityConfigOptions['dir']} dir
 * @returns {import('vite').UserConfigExport}
 */
async function getSharedConfig(eleventyDir) {
  const importAliasesToResolvedPath = Object.entries(getResolvedAliases(eleventyDir)).map(
    ([key, value]) => [IMPORT_ALIASES[key], value],
  )
  return vite.defineConfig({
    clearScreen: false,
    configFile: await getConfigFile(),
    resolve: {
      alias: Object.fromEntries(importAliasesToResolvedPath),
    },
  })
}

/**
 * Build production bundle
 * @param {import('../plugin/index').SlinkityConfigOptions['dir']} dir
 */
async function build({ eleventyDir, input, output }) {
  const inputFiles = await glob(`${input}/**/*.html`, { absolute: true })
  if (inputFiles.length) {
    await vite.build(
      vite.mergeConfig(
        {
          root: input,
          build: {
            outDir: output,
            emptyOutDir: true,
            rollupOptions: {
              input: inputFiles,
            },
          },
        },
        await getSharedConfig(eleventyDir),
      ),
    )
  }
}

module.exports = { build, getConfigFile, getSharedConfig, getResolvedAliases }
