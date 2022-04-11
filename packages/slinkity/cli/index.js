#!/usr/bin/env node
const { program } = require('commander')
const { startEleventy, toEleventyConfigDir } = require('./eleventy')
const readUserSlinkityConfig = require('./readUserSlinkityConfig')
const meta = require('../../../package.json')

const eleventyArgs = {
  input: {
    flag: '--input <input>',
    description: 'Input template files (defaults to eleventy config or `.`)',
  },
  output: {
    flag: '--output <output>',
    description: 'Write HTML output to this folder (defaults to eleventy config or `_site`)',
  },
  serve: {
    flag: '--serve',
    description:
      'Run Vite server and watch for file changes. Configure server options + production build options by creating a vite.config.js at the base of your project',
  },
  watch: {
    flag: '--watch',
    description: 'Wait for files to change and automatically rewrite (no web server)',
  },
  formats: {
    flag: '--formats <formats>',
    description: 'Whitelist only certain template types',
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
    description: 'Don’t write any files. Useful with `DEBUG=Eleventy* npx eleventy`',
  },
  incremental: {
    flag: '--incremental',
    description: 'Use eleventy incremental builds',
  },
  config: {
    flag: '--config <config>',
    description: 'Override the eleventy config file path',
    defaultValue: '.eleventy.js',
  },
  port: {
    flag: '--port <port>',
    description: 'Port for Vite server',
    defaultValue: 8080,
  },
}

const applyOption = (option) => program.option(option.flag, option.description, option.defaultValue)
const toEleventyOptions = (allOptions) => {
  const eleventyOptions = {}
  for (let [name, value] of Object.entries(allOptions)) {
    if (eleventyArgs[name] != null) {
      eleventyOptions[name] = value
    }
    if (name === 'serve' && value === true) {
      eleventyOptions.watch = true
    }
  }
  return eleventyOptions
}

program.version(meta.version)
applyOption(eleventyArgs.input)
applyOption(eleventyArgs.output)
applyOption(eleventyArgs.watch)
applyOption(eleventyArgs.serve)
applyOption(eleventyArgs.port)
applyOption(eleventyArgs.incremental)
applyOption(eleventyArgs.formats)
applyOption(eleventyArgs.quiet)
applyOption(eleventyArgs.config)
applyOption(eleventyArgs.pathprefix)
applyOption(eleventyArgs.dryrun)

program.parse()
const options = program.opts()
const userConfigDir = toEleventyConfigDir({
  configPath: options.config,
  input: options.input,
  output: options.output,
})

;(async () => {
  const userSlinkityConfig = await readUserSlinkityConfig()
  await startEleventy({
    dir: userConfigDir,
    userSlinkityConfig,
    options: toEleventyOptions(options),
  })
})()
