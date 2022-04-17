const vite = require('vite')
const path = require('path')
const fs = require('fs')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const { resolveConfigFilePath } = require('../utils/resolveConfigFilePath')
const { IMPORT_ALIASES, ELEVENTY_TEMP_BUILD_DIR, PACKAGES } = require('../utils/consts')

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
 * @param {import('../@types').Dir} dir
 * @returns {import('../@types').ImportAliases}
 */
function getResolvedImportAliases({ input, includes, layouts }) {
  return {
    root: path.join(process.cwd()),
    input: path.join(process.cwd(), input),
    includes: path.join(process.cwd(), input, includes),
    layouts: path.join(process.cwd(), input, layouts ?? includes),
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

  const importAliasesToResolvedPath = Object.entries(getResolvedImportAliases(dir)).map(
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
      include: userSlinkityConfig.renderers.length ? [PACKAGES.client] : [],
    },
  }

  return vite.defineConfig(vite.mergeConfig(config, mergedRendererConfig))
}

/**
 * Build production bundle
 * @typedef BuildParams
 * @property {import('../@types').Dir} eleventyConfigDir
 * @property {import('../@types').UserSlinkityConfig} userSlinkityConfig
 * @param {BuildParams}
 */
async function productionBuild({ eleventyConfigDir, userSlinkityConfig }) {
  const eleventyTempBuildDir = path.relative('.', ELEVENTY_TEMP_BUILD_DIR)
  const resolvedOutput = path.resolve(eleventyConfigDir.output)
  await fs.promises.rename(resolvedOutput, eleventyTempBuildDir)
  try {
    const inputFiles = await glob(`${eleventyTempBuildDir}/**/*.html`, { absolute: true })
    if (inputFiles.length) {
      await vite.build(
        vite.mergeConfig(
          {
            root: eleventyTempBuildDir,
            mode: 'production',
            build: {
              outDir: resolvedOutput,
              emptyOutDir: true,
              rollupOptions: {
                input: inputFiles,
              },
            },
          },
          await getSharedConfig({ dir: eleventyConfigDir, userSlinkityConfig }),
        ),
      )
    }
  } finally {
    await fs.promises.rmdir(eleventyTempBuildDir, { recursive: true, force: true })
  }
}

module.exports = {
  productionBuild,
  getConfigFile,
  getSharedConfig,
  getResolvedImportAliases,
}
