const { resolveConfigFilePath } = require('../utils/resolveConfigFilePath')
const { SLINKITY_CONFIG_FILE_NAME } = require('../utils/consts')
const requireFromString = require('require-from-string')
const { build } = require('esbuild')
const logger = require('../utils/logger')
const { defineConfig } = require('../main/defineConfig')

// Can cause a gotcha for ESM configs that use packages _without_ a CommonJS fallback
// See https://github.com/11ty/eleventy/issues/836
// TODO: explore rewriting Slinkity to ESM, and use esbuild to bundle our 11ty plugins to CommonJS
const supportedExts = ['js', 'ts']

async function readUserSlinkityConfig() {
  const configFile = await resolveConfigFilePath(
    supportedExts.map((ext) => `${SLINKITY_CONFIG_FILE_NAME}.${ext}`),
  )

  if (!configFile) return defineConfig()

  // we're using esbuild to process `ts` and ESM as cheaply as possible
  const { outputFiles } = await build({
    format: 'cjs',
    entryPoints: [configFile],
    bundle: false,
    write: false,
  })
  let config = requireFromString(outputFiles[0].text)
  // fixes ESM-based exports
  if (config?.default) {
    config = config.default
  }

  if (typeof config === 'function') {
    return defineConfig(await config())
  } else if (typeof config === 'object' && config !== null) {
    return defineConfig(config)
  } else {
    logger.log({
      type: 'error',
      message:
        'We expected your config to either return a function or an object. Double check that you are returning a valid config!',
    })
    return defineConfig()
  }
}

module.exports = {
  readUserSlinkityConfig,
}
