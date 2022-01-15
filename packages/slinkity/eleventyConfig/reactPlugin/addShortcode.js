const { join } = require('path')
const { log } = require('../../utils/logger')
const { toSSRComment } = require('../../utils/consts')

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
 * @param {AddShortcodeParams}
 */
module.exports = function addShortcode(
  eleventyConfig,
  { componentAttrStore, resolvedImportAliases },
) {
  eleventyConfig.addShortcode('react', function (componentPath, ...vargs) {
    const absComponentPath =
      join(resolvedImportAliases.includes, componentPath) +
      (componentPath.endsWith('.jsx') ? '' : '.jsx')

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
    })

    return toSSRComment(id)
  })
}
module.exports.argsArrayToPropsObj = argsArrayToPropsObj
