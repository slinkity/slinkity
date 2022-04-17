const path = require('path')
const { toSSRComment } = require('../utils/consts')
const { log } = require('../utils/logger')

/**
 * @typedef AddComponentShortcodesParams
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {any} eleventyConfig
 * @property {import('../@types').Renderer[]} renderers
 * @property {import('../@types').ImportAliases} importAliases
 * @param {AddComponentShortcodesParams}
 */
module.exports = function addComponentShortcode({
  renderers,
  eleventyConfig,
  componentAttrStore,
  importAliases,
}) {
  const extensionToRendererMap = Object.fromEntries(
    renderers.flatMap(({ name, extensions }) => extensions.map((ext) => [ext, name])),
  )

  eleventyConfig.addShortcode('component', function (componentPath, ...vargs) {
    const id = componentAttrStore.push(
      toComponentAttrStoreEntry({
        componentPath,
        vargs,
        children: '',
        importAliases,
        extensionToRendererMap,
        page: this.page,
      }),
    )

    return toSSRComment(id)
  })

  // TODO: remove for 1.0
  eleventyConfig.addShortcode('react', function (componentPath, ...vargs) {
    log({
      type: 'warning',
      message:
        'The "react" shortcode is now deprecated and will be removed in v1.0. We recommend using the "component" shortcode instead. See our documentation for more: https://slinkity.dev/docs/component-shortcodes',
    })

    const componentPathWithExt = componentPath.endsWith('.jsx')
      ? componentPath
      : `${componentPath}.jsx`

    const id = componentAttrStore.push(
      toComponentAttrStoreEntry({
        componentPath: componentPathWithExt,
        vargs,
        children: '',
        importAliases,
        extensionToRendererMap,
        page: this.page,
      }),
    )

    return toSSRComment(id)
  })

  eleventyConfig.addPairedShortcode(
    'slottedComponent',
    function (content, componentPath, ...vargs) {
      const id = componentAttrStore.push(
        toComponentAttrStoreEntry({
          componentPath,
          vargs,
          children: content,
          importAliases,
          extensionToRendererMap,
          page: this.page,
        }),
      )

      return toSSRComment(id)
    },
  )
}

const argsArrayToPropsObj = function ({ vargs = [], errorMsg = '' }) {
  if (vargs.length % 2 !== 0) {
    throw new Error(errorMsg)
  }
  const props = {}
  for (let i = 0; i < vargs.length; i += 2) {
    const key = vargs[i]
    const value = vargs[i + 1]
    props[key] = value
  }
  return props
}

module.exports.argsArrayToPropsObj = argsArrayToPropsObj

/**
 * @typedef ToComponentAttrStoreEntryParams
 * @property {string} componentPath
 * @property {any[]} vargs
 * @property {string} children
 * @property {import('../@types').ImportAliases} importAliases
 * @property {Record<string, string>} extensionToRendererMap
 * @property {{
 *  inputPath: string;
 *  outputPath: string;
 * }} page
 * @param {ToComponentAttrStoreEntryParams}
 * @returns {import('./componentAttrStore').ComponentAttrs}
 */
function toComponentAttrStoreEntry({
  componentPath,
  vargs,
  children,
  importAliases,
  extensionToRendererMap,
  page,
}) {
  const extension = path.extname(componentPath).replace(/^\./, '')
  if (!extension) {
    throw new Error(
      `File extensions are required when using the "component" and "slottedComponent" shortcodes. Try adding an extension to "${componentPath}"`,
    )
  }

  const renderer = extensionToRendererMap[extension]
  if (!renderer) {
    throw new Error(`We couldn't find a renderer for "${componentPath}".
Check that you have a renderer configured to handle "${extension}" extensions.
See our docs for more: https://slinkity.dev/docs/component-shortcodes`)
  }

  let props = {}
  if (typeof vargs[0] === 'object') {
    props = vargs[0]
  } else {
    props = argsArrayToPropsObj({
      vargs,
      errorMsg: `Looks like you passed a "prop" key without a corresponding value.
      Check your props on ${renderer} shortcode "${componentPath}"
      in file "${page.inputPath}"`,
    })
  }

  // eslint-disable-next-line no-unused-vars
  const { __keywords, ...restOfProps } = props

  if (restOfProps.render !== undefined) {
    log({
      type: 'warning',
      message: `The "render" prop no longer affects hydration as of v0.6! If you intended to use "render" to hydrate "${componentPath}," try using "hydrate" instead. Also note that components are no longer hydrated by default. See our docs for more: https://slinkity.dev/docs/component-shortcodes`,
    })
  }

  return {
    path: path.join(importAliases.includes, componentPath),
    rendererName: renderer,
    props: restOfProps,
    isSSR: props.renderWithoutSSR === undefined,
    loader: props.renderWithoutSSR ?? props.hydrate ?? 'none',
    children,
    pageOutputPath: page.outputPath,
    pageUrl: page.url,
  }
}
