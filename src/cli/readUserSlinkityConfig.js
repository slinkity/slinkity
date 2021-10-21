const { resolveConfigFilePath } = require('../utils/resolveConfigFilePath')
const { SLINKITY_CONFIG_FILE_NAME } = require('../utils/consts')
const requireFromString = require('require-from-string')
const { build } = require('esbuild')
const logger = require('../utils/logger')

// We only support CommonJS at the moment due to 11ty's Node version
// See https://github.com/11ty/eleventy/issues/836
// TODO: explore rewriting Slinkity to ESM, and use esbuild to bundle our 11ty plugins to CommonJS
const supportedExts = ['js', 'ts']

async function readUserSlinkityConfig() {
  const configFile = await resolveConfigFilePath(
    supportedExts.map((ext) => `${SLINKITY_CONFIG_FILE_NAME}.${ext}`),
  )

  if (!configFile) return {}

  // we're using esbuild to process `ts` as cheaply as possible
  const { outputFiles } = await build({
    format: 'cjs',
    entryPoints: [configFile],
    bundle: false,
    write: false,
  })
  const config = requireFromString(outputFiles[0].text)
  if (config?.default) {
    logger.log({
      type: 'error',
      message:
        "Uh oh! It looks like you're trying to use ESM in your Slinkity config. This unfortunately isn't supported right now, so we'd recommend using CommonJS syntax (i.e. `module.exports = {...}` instead of `export default {...}`).",
    })
    return {}
  }

  if (typeof config === 'function') {
    return await config()
  } else if (typeof config === 'object' && config !== null) {
    return config
  } else {
    logger.log({
      type: 'error',
      message:
        'We expected your config to either return a function or an object. Double check that you are returning a valid config!',
    })
    return {}
  }
}

module.exports = {
  readUserSlinkityConfig,
}
