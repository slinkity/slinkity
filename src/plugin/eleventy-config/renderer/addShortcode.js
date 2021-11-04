const { toMountPoint } = require('./toMountPoint')
const { join, extname } = require('path')
const { log } = require('../../../utils/logger')

const argsArrayToPropsObj = function ({ vargs = [], errorMsg = '' }) {
  if (vargs.length % 2 !== 0) {
    log({ type: 'warning', message: errorMsg })
    return {}
  }
  const props = {}
  for (let i = 0; i < vargs.length; i += 2) {
    const key = vargs[i]
    const value = vargs[i + 1]
    props[key] = value
  }
  return props
}

/**
 * @param {object} eleventyConfig
 * @typedef AddShortcodeParams
 * @property {import('../../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../../../cli/vite').ResolvedImportAliases} resolvedImportAliases
 * @property {import('../../../main/defineConfig').Renderer} renderer
 * @param {AddShortcodeParams}
 */
module.exports.addShortcode = function (
  eleventyConfig,
  { componentAttrStore, resolvedImportAliases, renderer },
) {
  eleventyConfig.addShortcode(renderer.name, function (componentPath, ...vargs) {
    // TODO: check that dropping the default extension (ex. jsx) doesn't break things
    const absComponentPath = join(resolvedImportAliases.includes, componentPath)

    let props = {}

    if (typeof vargs[0] === 'object') {
      props = vargs[0]
    } else {
      props = argsArrayToPropsObj({
        vargs,
        errorMsg: `Looks like you passed a "prop" key without a corresponding value.
  Check your props on react shortcode "${componentPath}"
  in file "${this.page.inputPath}"`,
      })
    }

    const { render = 'eager' } = props
    const id = componentAttrStore.push({
      path: absComponentPath,
      props,
      hydrate: render,
      styleToFilePathMap: {},
      pageOutputPath: this.page.outputPath,
      rendererName: renderer.name,
    })

    const html = toMountPoint({ id, hydrate: render })

    // Fixes https://github.com/slinkity/slinkity/issues/15
    // To prevent 11ty's markdown parser from wrapping components in <p> tags,
    // We need to wrap our custom element in some recognizable block (like a <div>)
    if (extname(this.page.inputPath) === '.md' && render !== 'static') {
      return `<div>${html}</div>`
    } else {
      return html
    }
  })
}

module.exports.argsArrayToPropsObj = argsArrayToPropsObj
