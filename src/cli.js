#!/usr/bin/env node
const { program } = require('commander')
const UserConfig = require('@11ty/eleventy/src/UserConfig')
const { join } = require('path')
const meta = require('../package.json')
const eleventyDefaults = require('./utils/eleventyDefaults')
const parseSimpleShellCmd = require('./utils/parseSimpleShellCmd')
const concurrentlyByArgvs = require('./utils/concurrentlyByArgvs')

const ELEVENTY_VERSION = `@11ty/eleventy@${meta.dependencies['@11ty/eleventy']}`

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
    description: 'Command Slinkity should run to start eleventy. Useful if you want to try a different 11ty version or canary, i.e. `npx @11ty/eleventy@canaryX.X.X',
    defaultValue: `npx ${ELEVENTY_VERSION}`,
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

program.version(meta.version)
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

const eleventyCmdArgv = Object.entries(options).reduce(
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
  [
    ...parseSimpleShellCmd(options.eleventyCmd),
    `--config=${join(__dirname, 'eleventy-wrapper.js')}`,
  ]
)

const eleventyConfigPath = join(process.cwd(), options.config)
let eleventyConfig
try {
  eleventyConfig = require(eleventyConfigPath)
} catch (e) { /* we'll use defaults if no eleventyConfig is present */ }

const userConfigDir = eleventyConfig?.(new UserConfig())?.dir ?? {}

const dir = {
  ...eleventyDefaults.dir,
  ...userConfigDir,
  input: options.input ?? userConfigDir.input ?? eleventyDefaults.dir.input,
  output: options.output ?? userConfigDir.output ?? eleventyDefaults.dir.output,
}

const viteCmdArgv = [
  ...parseSimpleShellCmd(options.viteCmd),
  '--clearScreen=false',
  `--port=${options.port}`,
  dir.output,
]

const eleventyCmd = {
  argv: eleventyCmdArgv,
  name: '11ty',
  prefixColor: '#faff02',
  env: {
    ELEVENTY_EXPERIMENTAL: true,
    SLINKITY_SERVE: options.serve,
    SLINKITY_CONFIG: JSON.stringify({
      config: eleventyConfigPath,
      dir,
    }),
  },
}
const viteCmd = {
  argv: viteCmdArgv,
  name: 'vite',
  prefixColor: '#ff00d6',
}

;(async () => {
  if (options.serve) {
    await concurrentlyByArgvs([eleventyCmd, viteCmd])
  } else {
    await concurrentlyByArgvs([eleventyCmd], { raw: true })
  }
})().catch(() => {})
