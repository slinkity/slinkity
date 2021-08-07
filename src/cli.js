#!/usr/bin/env node
const concurrently = require('concurrently')
const { program } = require('commander')
const UserConfig = require('@11ty/eleventy/src/UserConfig')
const { join, resolve } = require('path')
const { quote: unixQuote } = require('shell-quote')
const meta = require('../package.json')
const winQuote = (args) =>
  args.map((arg) => `"${arg.replace(/"/g, '\\"')}"`).join(' ')
const quote = process.platform === 'win32' ? winQuote : unixQuote
const eleventyDefaults = require('./utils/eleventyDefaults')
const { CACHE_DIRECTORY } = require('./utils/consts')

const eleventyArgs = {
  watch: {
    flag: '--watch',
    description:
      'Wait for files to change and automatically rewrite (no web server)',
  },
  formats: {
    flag: '--formats <formats>',
    description: 'Whitelist only certain template types',
    defaultValue: 'liquid,md',
  },
  quiet: {
    flag: '--quiet',
    description: 'Don’t print all written files (off by default)',
  },
  pathprefix: {
    flag: '--pathprefix <pathprefix>',
    description: 'Change all url template filters to use this subdirectory.',
    defaultValue: '/',
  },
  dryrun: {
    flag: '--dryrun',
    description:
      'Don’t write any files. Useful with `DEBUG=Eleventy* npx eleventy`',
  },
  incremental: {
    flag: '--incremental',
    description: 'Use eleventy incremental builds',
  },
}

const slinkityArgs = {
  input: {
    flag: '--input <input>',
    description: 'Input template files (defaults to eleventy config or `.`)',
  },
  output: {
    flag: '--output <output>',
    description:
      'Write HTML output to this folder (defaults to eleventy config or `_site`)',
  },
  config: {
    flag: '--config <config>',
    description: 'Override the eleventy config file path',
    defaultValue: '.eleventy.js',
  },
  eleventyCmd: {
    flag: '--eleventy-cmd <cmd>',
    description:
      'Command Slinkity should run to start eleventy. Useful if you want to try a different 11ty version or canary, i.e. `npx @11ty/eleventy@canaryX.X.X',
    defaultValue: 'npx @11ty/eleventy',
  },
  viteCmd: {
    flag: '--vite-cmd <cmd>',
    description:
      'Command Slinkity should run to start Vite. Useful if you want to try a different Vite version, i.e. `npx vite@X.X.X`',
    defaultValue: 'snowpack dev',
  },
  serve: {
    flag: '--serve',
    description:
      'Run Vite server and watch for file changes. Configure server options + production build options by creating a vite.config.js at the base of your project',
  },
  port: {
    flag: '--port <port>',
    description: 'Port for Vite server',
    defaultValue: '8080',
  },
}

const isEleventyArg = (arg) => Boolean(eleventyArgs[arg])
const applyOption = (option) =>
  program.option(option.flag, option.description, option.defaultValue)

program.version(meta.version)
applyOption(slinkityArgs.input)
applyOption(slinkityArgs.output)
applyOption(eleventyArgs.watch)
applyOption(slinkityArgs.serve)
applyOption(slinkityArgs.port)
applyOption(eleventyArgs.incremental)
applyOption(eleventyArgs.formats)
applyOption(eleventyArgs.quiet)
applyOption(slinkityArgs.config)
applyOption(eleventyArgs.pathprefix)
applyOption(eleventyArgs.dryrun)
applyOption(slinkityArgs.eleventyCmd)
applyOption(slinkityArgs.viteCmd)

program.parse()

const options = program.opts()
const mode = options.serve ? 'serve' : options.watch ? 'watch' : 'build'

const eleventyCmdArgs = quote(
  Object.entries(options).reduce(
    (eleventyCmdArgs, [arg, value]) => {
      if (
        isEleventyArg(arg) &&
        value !== undefined &&
        value !== eleventyArgs[arg]?.defaultValue
      ) {
        return [...eleventyCmdArgs, `--${arg}=${value}`]
      } else if (arg === 'serve' && value) {
        // 11ty should always run in --watch mode,
        // since our dev server is replacing Browsersync
        return [...eleventyCmdArgs, '--watch']
      } else {
        return eleventyCmdArgs
      }
    },
    [`--config=${join(__dirname, 'eleventy-wrapper.js')}`]
  )
)

const eleventyConfig = require(join(process.cwd(), options.config))
const { dir: userConfigDir = {} } = eleventyConfig(new UserConfig())

const dir = {
  ...eleventyDefaults.dir,
  ...userConfigDir,
  input: options.input ?? userConfigDir.input ?? eleventyDefaults.dir.input,
  // When in "build" or "watch" mode, eleventy should build
  // To an internal .cache for Snowpack to read from
  // This avoids any "temp" directories we'd have to maintain
  output:
    mode === 'build' || mode === 'watch'
      ? CACHE_DIRECTORY
      : options.output ?? userConfigDir.output ?? eleventyDefaults.dir.output,
}

const viteCmdArgs = quote([`--port=${options.port}`])

const eleventyCmd = {
  command: `${options.eleventyCmd} ${eleventyCmdArgs}`,
  name: 'eleventy',
  prefixColor: '#faff02',
  env: {
    ELEVENTY_EXPERIMENTAL: true,
    SLINKITY_SERVE: options.serve,
    SLINKITY_CONFIG: JSON.stringify({
      config: resolve(options.config),
      dir,
    }),
  },
}
console.log(resolve(process.cwd(), CACHE_DIRECTORY))
const viteCmd = {
  command: `${options.viteCmd} ${viteCmdArgs}`,
  name: 'snowpack',
  prefixColor: '#ff00d6',
  cwd:
    mode === 'build' || mode === 'watch'
      ? resolve(process.cwd(), CACHE_DIRECTORY)
      : resolve(process.cwd(), dir.output),
}

;(async () => {
  if (options.serve) {
    await concurrently([eleventyCmd, viteCmd])
  } else {
    await concurrently([eleventyCmd], { prefix: 'none' })
  }
})().catch(() => {})
