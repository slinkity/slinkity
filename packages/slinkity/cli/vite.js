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
 * @typedef {import('../utils/consts').ImportAliases} ImportAliases
 * @typedef {Record<keyof import('../utils/consts').ImportAliases, string>} ResolvedImportAliases
 * @param {import('../eleventyConfig/index').SlinkityConfigOptions['dir']} dir
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
 * @param {import('../eleventyConfig/index').SlinkityConfigOptions['dir']} dir
 * @returns {import('vite').UserConfigExport}
 */
async function getSharedConfig(eleventyDir) {
  const importAliasesToResolvedPath = Object.entries(getResolvedAliases(eleventyDir)).map(
    ([key, value]) => [IMPORT_ALIASES[key], value],
  )
  let reactConfig = vite.defineConfig()
  try {
    require('react')
    require('react-dom')
    reactConfig = vite.defineConfig({
      resolve: {
        dedupe: ['react', 'react-dom'],
      },
      optimizeDeps: {
        include: ['react', 'react/jsx-runtime', 'react/jsx-dev-runtime', 'react-dom'],
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              react: ['react'],
            },
          },
        },
      },
    })
  } catch {
    // no-op
  }
  return vite.mergeConfig(
    vite.defineConfig({
      clearScreen: false,
      configFile: await getConfigFile(),
      resolve: {
        alias: Object.fromEntries(importAliasesToResolvedPath),
      },
      optimizeDeps: {
        include: ['slinkity/client'],
      },
    }),
    reactConfig,
  )
}

/**
 * Build production bundle
 * @param {import('../eleventyConfig/index').SlinkityConfigOptions['dir']} dir
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
