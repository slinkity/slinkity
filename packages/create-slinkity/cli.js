#!/usr/bin/env node
const path = require('path')
const fs = require('fs')
const { yellow, red } = require('kolorist')
const prompts = require('prompts')

const PKG = 'package.json'

function toSlinkityConfigContents(selectedComponentFlavors) {
  const componentFlavorToRenderer = {
    react: 'reactRenderer',
    vue: 'vueRenderer',
    svelte: 'svelteRenderer',
  }
  const componentFlavorToImportStatement = {
    react: `import ${componentFlavorToRenderer.react} from '@slinkity/renderer-react'`,
    vue: `import ${componentFlavorToRenderer.vue} from '@slinkity/renderer-vue'`,
    svelte: `import ${componentFlavorToRenderer.svelte} from '@slinkity/renderer-svelte'`,
  }
  const renderers = selectedComponentFlavors.map((flavor) => componentFlavorToRenderer[flavor])
  const imports = selectedComponentFlavors.map((flavor) => componentFlavorToImportStatement[flavor])
  return `import { defineConfig } from 'slinkity'
${imports.join('\n')}

export default defineConfig({
  renderers: [${renderers.join(', ')}],
})
`
}

;(async () => {
  let dest = process.argv[2]
  const promptResponses = await prompts([
    {
      type: dest ? null : 'text',
      name: 'dest',
      message: 'What is your project called?',
      initial: 'my-slinkity-site',
    },
    {
      type: 'multiselect',
      name: 'components',
      message: 'Which flavor of components do you want?',
      choices: [
        { title: 'React', value: 'react' },
        { title: 'Vue', value: 'vue' },
        { title: 'Svelte', value: 'svelte' },
      ],
    },
  ])
  if (!dest) {
    dest = promptResponses.dest
  }
  // if there's no dest provided as a CLI argument OR by a prompt,
  // they must have ctrl + C'd out of the program
  if (!dest) process.exit(0)

  const srcResolved = path.join(__dirname, 'template')
  const destResolved = path.join(process.cwd(), dest)
  fs.mkdirSync(destResolved)

  const pkg = require(path.join(srcResolved, PKG))
  pkg.name = toValidPackageName(dest)
  fs.writeFileSync(path.join(destResolved, PKG), JSON.stringify(pkg, null, 2))

  const templateFilePaths = fs.readdirSync(srcResolved).filter((filePath) => filePath !== PKG)
  for (const templateFilePath of templateFilePaths) {
    const src = path.join(srcResolved, templateFilePath)
    const dest = path.join(destResolved, templateFilePath)
    copy(src, dest)
  }
  if (promptResponses.components.length) {
    fs.writeFileSync(
      path.join(destResolved, 'slinkity.config.js'),
      toSlinkityConfigContents(promptResponses.components),
    )
  }

  console.log(`Welcome to your first ${yellow('Slinkity site!')}`)
  console.log('Step 1: run these commands to install and serve locally 👇')
  console.log(`
cd ${dest}
npm i
npm start
`)
  console.log(`Step 2: ${red('have fun ❤️')}`)
})()

/**
 * Util to copy file or file directory to dest
 * Inspired by https://github.com/vitejs/vite/blob/main/packages/create-vite/index.js
 * @param {string} src
 * @param {string} dest
 */
function copy(src, dest) {
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    copyDir(src, dest)
  } else {
    fs.copyFileSync(src, dest)
  }
}

/**
 * Util to copy file directory to test
 * Inspired by https://github.com/vitejs/vite/blob/main/packages/create-vite/index.js
 * @param {string} srcDir
 * @param {string} destDir
 */
function copyDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true })
  for (const file of fs.readdirSync(srcDir)) {
    const srcFile = path.resolve(srcDir, file)
    const destFile = path.resolve(destDir, file)
    copy(srcFile, destFile)
  }
}

/**
 * Util to convert a project name into a valid package name for a package.json
 * Inspired by https://github.com/vitejs/vite/blob/main/packages/create-vite/index.js
 * @param {string} projectName
 * @returns {string} A valid package name
 */
function toValidPackageName(projectName) {
  return projectName
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/^[._]/, '')
    .replace(/[^a-z0-9-~]+/g, '-')
}
