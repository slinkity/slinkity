const { normalizePath } = require('vite')
const { relative } = require('path')
const {
  SLINKITY_ATTRS,
  SLINKITY_REACT_MOUNT_POINT,
  SLINKITY_HEAD_STYLES,
  toSSRComment,
} = require('../utils/consts')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const toLoaderScript = require('./toLoaderScript')
const toHtmlAttrString = require('../utils/toHtmlAttrString')

const ssrRegex = RegExp(toSSRComment('([0-9]+)'), 'g')

/**
 * Process all SSR comments - server render components, apply scripts, inject styles into head
 * Extracted from applyViteHtmlTransform for unit testing!
 * @typedef HandleSSRCommentsParams
 * @property {string} content - the original HTML content to transform
 * @property {string} outputPath - the output path this HTML content will be written to
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('.').SlinkityConfigOptions['viteSSR']} viteSSR
 * @property {any[]} renderers
 * @param {HandleSSRCommentsParams}
 * @returns {Promise<string>} - HTML with components SSR'd
 */
async function handleSSRComments({ content, outputPath, componentAttrStore, viteSSR, renderers }) {
  /** @type {Record<string, any>} */
  const rendererMap = Object.fromEntries(renderers.map((renderer) => [renderer.name, renderer]))

  /** @type {Set<string>} */
  const importedStyles = new Set()
  const pageComponentAttrs = componentAttrStore.getAllByPage(outputPath)
  const serverRenderedComponents = []
  for (const componentAttrs of pageComponentAttrs) {
    const { path: componentPath, props, hydrate, rendererName } = componentAttrs
    const renderer = rendererMap[rendererName]
    const { default: serverRenderer } = await viteSSR.toCommonJSModule(renderer.server)
    if (renderer.processImportedStyles) {
      const { __importedStyles } = await viteSSR.toCommonJSModule(componentPath)
      __importedStyles.forEach((importedStyle) => importedStyles.add(importedStyle))
    }
    const serverRendered = await serverRenderer({
      toCommonJSModule: viteSSR.toCommonJSModule,
      componentPath,
      props,
      // TODO: add children to componentAttrStore
      children: '',
      hydrate,
    })
    serverRenderedComponents.push(serverRendered.html)
  }

  const html = content
    // server render each component
    .replace(ssrRegex, (_, id) => {
      const { path: componentPath, props, hydrate, rendererName } = pageComponentAttrs[id]
      const clientRenderer = rendererMap[rendererName].client
      const loaderScript = toLoaderScript({ componentPath, props, hydrate, id, clientRenderer })
      const attrs = toHtmlAttrString({ [SLINKITY_ATTRS.id]: id })
      return `<${SLINKITY_REACT_MOUNT_POINT} ${attrs}>\n\t${serverRenderedComponents[id]}\n</${SLINKITY_REACT_MOUNT_POINT}>\n${loaderScript}`
    })
    // inject component styles into head
    .replace(
      SLINKITY_HEAD_STYLES,
      [...importedStyles]
        .map(
          (importedStyle) =>
            `<link ${toHtmlAttrString({
              rel: 'stylesheet',
              href: importedStyle,
            })}>`,
        )
        .join('\n'),
    )
  return html
}

/**
 * @typedef ApplyViteHtmlTransformParams
 * @property {string} content - the original HTML content to transform
 * @property {string} outputPath - the output path this HTML content will be written to
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {any[]} renderers
 * @param {ApplyViteHtmlTransformParams & import('.').SlinkityConfigOptions}
 * @returns {Promise<string>} - HTML with statically rendered content and Vite transforms applied
 */
async function applyViteHtmlTransform({
  content,
  outputPath,
  componentAttrStore,
  environment,
  viteSSR,
  renderers,
  dir,
}) {
  if (!outputPath || !outputPath.endsWith('.html')) {
    return content
  }
  const html = await handleSSRComments({
    content,
    outputPath,
    componentAttrStore,
    viteSSR,
    renderers,
  })
  const server = viteSSR.getServer()
  const routePath = '/' + toSlashesTrimmed(normalizePath(relative(dir.output, outputPath)))
  return environment === 'dev' && server ? server.transformIndexHtml(routePath, html) : html
}

module.exports = { applyViteHtmlTransform, handleSSRComments }
