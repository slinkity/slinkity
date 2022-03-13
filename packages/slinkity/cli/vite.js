const vite = require('vite')
const { join } = require('path')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const { resolveConfigFilePath } = require('../utils/resolveConfigFilePath')
const { IMPORT_ALIASES } = require('../utils/consts')

/**
 * Returns config file path or undefined if config file does not exist.
 *
 * @return {string|undefined} File path.
 */
function getConfigFile() {
  return resolveConfigFilePath(['js', 'mjs', 'ts'].map((ext) => `vite.config.${ext}`))
}

/**
 * Returns object with resolved aliases.
 *
 * @typedef {import('../@types').Dir} Dir
 * @typedef {import('../utils/consts').ImportAliases} ImportAliases
 * @typedef {Record<keyof import('../utils/consts').ImportAliases, string>} ResolvedImportAliases
 * @param {Dir} dir
 * @returns {ResolvedImportAliases}
 */
function getResolvedAliases({ input, includes, layouts }) {
  return {
    root: join(process.cwd()),
    input: join(process.cwd(), input),
    includes: join(process.cwd(), includes),
    layouts: join(process.cwd(), layouts ?? includes),
  }
}

/**
 * Get Vite config shared by dev and production
 *
 * @typedef SharedConfigParams
 * @property {Dir} dir
 * @property {import('../@types').UserSlinkityConfig} userSlinkityConfig
 * @param {SharedConfigParams}
 * @returns {import('vite').UserConfigExport}
 */
async function getSharedConfig({ dir, userSlinkityConfig }) {
  const rendererConfigs = await Promise.all(
    userSlinkityConfig.renderers.map((renderer) => renderer.viteConfig?.()),
  )

  const mergedRendererConfig = vite.defineConfig(
    rendererConfigs.reduce((acc, config) => {
      return vite.mergeConfig(acc, config)
    }, {}),
  )

  const importAliasesToResolvedPath = Object.entries(getResolvedAliases(dir)).map(
    ([key, value]) => [IMPORT_ALIASES[key], value],
  )

  /** @type {import('vite').UserConfigExport} */
  const config = {
    clearScreen: false,
    configFile: await getConfigFile(),
    resolve: {
      alias: Object.fromEntries(importAliasesToResolvedPath),
    },
    optimizeDeps: {
      include: ['slinkity/client'],
    },
  }

  return vite.defineConfig(vite.mergeConfig(config, mergedRendererConfig))
}

/**
 * Build production bundle
 * @typedef BuildParams
 * @property {string} input
 * @property {string} output
 * @property {Dir} eleventyDir
 * @property {import('../@types').UserSlinkityConfig} userSlinkityConfig
 * @param {BuildParams}
 */
async function build({ eleventyDir, userSlinkityConfig, input, output }) {
  const inputFiles = await glob(`${input}/**/*.html`, { absolute: true })
  if (inputFiles.length) {
    await vite.build(
      vite.mergeConfig(
        {
          root: input,
          mode: 'production',
          build: {
            outDir: output,
            emptyOutDir: true,
            rollupOptions: {
              input: inputFiles,
            },
          },
        },
        await getSharedConfig({ dir: eleventyDir, userSlinkityConfig }),
      ),
    )
  }
}

module.exports = { build, getConfigFile, getSharedConfig, getResolvedAliases }
