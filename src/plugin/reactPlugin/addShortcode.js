const toRendererHtml = require('./toRendererHtml')
const { join, extname } = require('path')
const toCommonJSModule = require('./toCommonJSModule')
const { log } = require('../../utils/logger')

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
 * @param {{
 *   componentAttrStore: import('./componentAttrStore').ComponentAttrStore,
 *   dir: {
 *     input: string,
 *     output: string,
 *   }
 * }} params
 */
module.exports = function addShortcode(eleventyConfig, { componentAttrStore, dir }) {
  eleventyConfig.addAsyncShortcode('react', async function (componentPath, ...vargs) {
    const relComponentPath =
      join(dir.includes, componentPath) + (componentPath.endsWith('.jsx') ? '' : '.jsx')

    const props = argsArrayToPropsObj({
      vargs,
      errorMsg: `Looks like you passed a "prop" key without a corresponding value.
Check your props on react shortcode "${componentPath}"
in file "${this.page.inputPath}"`,
    })

    const { default: Component = () => {}, __stylesGenerated = '' } = await toCommonJSModule({
      inputPath: join(dir.input, relComponentPath),
    })

    const { render = 'eager' } = props
    const id = componentAttrStore.push({
      path: relComponentPath,
      props,
      hydrate: render,
      styles: __stylesGenerated,
    })

    const html = toRendererHtml({
      id,
      Component,
      props,
      render,
    })

    // Fixes https://github.com/slinkity/slinkity/issues/15
    // To prevent 11ty's markdown parser from wrapping components in <p> tags,
    // We need to wrap our custom element in some recognizable block (like a <div>)
    if (extname(this.page.inputPath) === '.md') {
      return `<div>${html}</div>`
    } else {
      return html
    }
  })
}
module.exports.argsArrayToPropsObj = argsArrayToPropsObj
