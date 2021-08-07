#!/usr/bin/env node
const concurrently = require('concurrently')
const { program } = require('commander')
const UserConfig = require('@11ty/eleventy/src/UserConfig')
const { join, resolve } = require('path')
const { quote: unixQuote } = require('shell-quote')
const winQuote = (args) =>
  args.map((arg) => `"${arg.replace(/"/g, '\\"')}"`).join(' ')
const quote = process.platform === 'win32' ? winQuote : unixQuote
const eleventyDefaults = require('./utils/eleventyDefaults')

const eleventyArgs = {
  input: {
    flag: '--input <input>',
    description: 'Input template files (defaults to eleventy config or `.`)',
  },
  output: {
    flag: '--output <output>',
    description:
      'Write HTML output to this folder (defaults to eleventy config or `_site`)',
  },
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
    defaultValue: 'npx vite',
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

program.version('0.0.1')
applyOption(eleventyArgs.input)
applyOption(eleventyArgs.output)
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
        // since Vite is replacing Browsersync
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
  output: options.output ?? userConfigDir.output ?? eleventyDefaults.dir.output,
}

const viteCmdArgs = quote([
  '--clearScreen=false',
  `--port=${options.port}`,
  dir.output,
])

const eleventyCmd = {
  command: `${options.eleventyCmd} ${eleventyCmdArgs}`,
  name: '11ty',
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
const viteCmd = {
  command: `${options.viteCmd} ${viteCmdArgs}`,
  name: 'vite',
  prefixColor: '#ff00d6',
}

;(async () => {
  if (options.serve) {
    await concurrently([eleventyCmd, viteCmd])
  } else {
    await concurrently([eleventyCmd], { prefix: 'none' })
  }
})().catch(() => {})
