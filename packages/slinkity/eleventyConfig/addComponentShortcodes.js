const path = require('path')
const { log } = require('../utils/logger')
const { toSSRComment } = require('../utils/consts')

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
 * @typedef AddComponentShortcodesParams
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../cli/vite').ResolvedImportAliases} resolvedImportAliases
 * @property {any} eleventyConfig
 * @property {any} renderer
 * @param {AddComponentShortcodesParams}
 */
module.exports = function addShortcode({
  renderer,
  eleventyConfig,
  resolvedImportAliases,
  componentAttrStore,
}) {
  eleventyConfig.addShortcode(renderer.name, function (componentPath, ...vargs) {
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

    /** @type {{ hydrate: import('../cli/types').HydrationMode }} */
    const { hydrate = 'none' } = props
    const id = componentAttrStore.push({
      path: path.join(resolvedImportAliases.includes, componentPath),
      rendererName: renderer.name,
      props,
      hydrate,
      pageOutputPath: this.page.outputPath,
    })

    return toSSRComment(id)
  })
}
module.exports.argsArrayToPropsObj = argsArrayToPropsObj
