// TODO: fix 11ty debug helper
const Eleventy = require('@11ty/eleventy/src/Eleventy')
const EleventyErrorHandler = require('@11ty/eleventy/src/EleventyErrorHandler')
const UserConfig = require('@11ty/eleventy/src/UserConfig')
const { resolve } = require('path')
const { plugin } = require('../plugin')
const { ELEVENTY_DEFAULT_DIRS } = require('../utils/consts')

function toUserConfig(configPath = '') {
  let userConfig
  try {
    userConfig = require(resolve(configPath))
    return userConfig
  } catch {
    /* we'll use defaults if no config file is present */
    return null
  }
}

function toEleventyConfigDir({ configPath = '', input = null, output = null }) {
  const userConfig = toUserConfig(configPath)

  let userConfigDir = {}
  if (typeof userConfig === 'function') {
    userConfigDir = userConfig?.(new UserConfig())?.dir ?? {}
  } else if (typeof userConfig === 'object') {
    userConfigDir = userConfig?.dir ?? {}
  }

  return {
    ...ELEVENTY_DEFAULT_DIRS,
    ...userConfigDir,
    input: input ?? userConfigDir.input ?? ELEVENTY_DEFAULT_DIRS.input,
    output: output ?? userConfigDir.output ?? ELEVENTY_DEFAULT_DIRS.output,
  }
}

/**
 * @typedef StartEleventyParams
 * @property {import('../@types').Dir} dir
 * @property {import('../@types').UserSlinkityConfig} userSlinkityConfig
 * @property {object} options
 * @param {StartEleventyParams}
 */
async function startEleventy({ dir, userSlinkityConfig, options }) {
  if (process.env.DEBUG) {
    require('time-require')
  }

  const errorHandler = new EleventyErrorHandler()
  process.on('unhandledRejection', (error) => {
    errorHandler.fatal(error, 'Unhandled rejection in promise')
  })
  process.on('uncaughtException', (error) => {
    errorHandler.fatal(error, 'Uncaught exception')
  })
  process.on('rejectionHandled', (promise) => {
    errorHandler.warn(promise, 'A promise rejection was handled asynchronously')
  })

  const elev = new Eleventy(dir.input, dir.output, {
    quietMode: options.quiet,
    configPath: options.config,
    config(eleventyConfig) {
      eleventyConfig.addPlugin(plugin, userSlinkityConfig)
    },
    source: 'cli',
  })

  elev.setPathPrefix(options.pathprefix)
  elev.setDryRun(options.dryrun)
  elev.setIncrementalBuild(options.incremental)
  elev.setPassthroughAll(options.passthroughall)
  elev.setFormats(options.formats)

  await elev.init()
  if (options.watch) {
    await elev.watch()

    if (options.serve) {
      elev.serve(options.port)
    }
  } else {
    await elev.write()
  }
}

module.exports = { toEleventyConfigDir, startEleventy }
