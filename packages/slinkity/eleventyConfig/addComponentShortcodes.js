const path = require('path')
const { toSSRComment } = require('../utils/consts')

/**
 * @typedef AddComponentShortcodesParams
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../cli/vite').ResolvedImportAliases} resolvedImportAliases
 * @property {any} eleventyConfig
 * @property {import('../cli/types').Renderer[]} renderers
 * @param {AddComponentShortcodesParams}
 */
module.exports = function addComponentShortcode({
  renderers,
  eleventyConfig,
  resolvedImportAliases,
  componentAttrStore,
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
        resolvedImportAliases,
        extensionToRendererMap,
        page: this.page,
      }),
    )

    return toSSRComment(id)
  })

  eleventyConfig.addPairedShortcode('componentWrap', function (content, componentPath, ...vargs) {
    const id = componentAttrStore.push(
      toComponentAttrStoreEntry({
        componentPath,
        vargs,
        children: content,
        resolvedImportAliases,
        extensionToRendererMap,
        page: this.page,
      }),
    )

    return toSSRComment(id)
  })
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
 * @property {import('../cli/vite').ResolvedImportAliases} resolvedImportAliases
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
  resolvedImportAliases,
  extensionToRendererMap,
  page,
}) {
  const extension = path.extname(componentPath).replace(/^\./, '')
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

  /** @type {{ hydrate: import('../cli/types').HydrationMode }} */
  const { hydrate = 'none' } = props
  return {
    path: path.join(resolvedImportAliases.includes, componentPath),
    rendererName: renderer,
    props: restOfProps,
    hydrate,
    children,
    pageOutputPath: page.outputPath,
  }
}
