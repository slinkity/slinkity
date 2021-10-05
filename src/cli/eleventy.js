// TODO: fix 11ty debug helper
const Eleventy = require('@11ty/eleventy/src/Eleventy')
const EleventyErrorHandler = require('@11ty/eleventy/src/EleventyErrorHandler')
const UserConfig = require('@11ty/eleventy/src/UserConfig')
const slinkityConfig = require('../plugin')
const toViteSSR = require('./toViteSSR')
const { resolve } = require('path')

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
  const defaultDir = {
    input: '.',
    output: '_site',
    includes: '_includes',
    layouts: '_includes',
  }

  let userConfigDir = {}
  if (typeof userConfig === 'function') {
    userConfigDir = userConfig?.(new UserConfig())?.dir ?? {}
  } else if (typeof userConfig === 'object') {
    userConfigDir = userConfig?.dir ?? {}
  }

  return {
    ...defaultDir,
    ...userConfigDir,
    input: input ?? userConfigDir.input ?? defaultDir.input,
    output: output ?? userConfigDir.output ?? defaultDir.output,
  }
}

function applyUserConfigDir(dir = {}) {
  return async function startEleventy(options = {}) {
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

    const viteSSR = await toViteSSR({ dir, environment: options.watch ? 'dev' : 'prod' })
    const config = slinkityConfig({ dir, viteSSR })

    let elev = new Eleventy(dir.input, dir.output, {
      quietMode: options.quiet,
      configPath: options.config,
      config,
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
      elev.serve('3000')
    } else {
      await elev.write()
    }
  }
}

module.exports = { toEleventyConfigDir, startEleventy: applyUserConfigDir }
