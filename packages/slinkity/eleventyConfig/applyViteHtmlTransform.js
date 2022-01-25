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
 * @property {import('../cli/types').Renderer[]} renderers
 * @param {HandleSSRCommentsParams}
 * @returns {Promise<string>} - HTML with components SSR'd
 */
async function handleSSRComments({
  content,
  outputPath,
  componentAttrStore,
  viteSSR,
  renderers,
  importedStyles = new Set(),
}) {
  /** @type {Record<string, any>} */
  const rendererMap = Object.fromEntries(renderers.map((renderer) => [renderer.name, renderer]))

  const pageComponentAttrs = componentAttrStore.getAllByPage(outputPath)
  const serverRenderedComponents = []
  for (const componentAttrs of pageComponentAttrs) {
    const { path: componentPath, props, hydrate, rendererName } = componentAttrs
    const renderer = rendererMap[rendererName]
    const { default: serverRenderer } = await viteSSR.toCommonJSModule(renderer.server)
    if (renderer.injectImportedStyles) {
      const { __importedStyles } = await viteSSR.toCommonJSModule(componentPath)
      __importedStyles.forEach((importedStyle) => importedStyles.add(importedStyle))
    }
    let shortcodes = props.__slinkity?.shortcodes
    let propsWithShortcodes = props
    if (typeof shortcodes === 'object' && hydrate === 'none') {
      try {
        const { toComponentByShortcode } = await viteSSR.toCommonJSModule(
          renderer.toComponentByShortcode,
        )
        propsWithShortcodes = {
          ...props,
          __slinkity: {
            ...(props.__slinkity ?? {}),
            shortcodes: Object.fromEntries(
              Object.entries(shortcodes).map(([name, shortcode]) => [
                name,
                (...unnamedArgs) => toComponentByShortcode({ unnamedArgs, shortcode }),
              ]),
            ),
          },
        }
      } catch {
        // This renderer can't handle shortcodes-as-components.
        // Do nothing!
      }
    }
    const serverRendered = await serverRenderer({
      toCommonJSModule: viteSSR.toCommonJSModule,
      componentPath,
      props: propsWithShortcodes,
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
      return `<${SLINKITY_REACT_MOUNT_POINT} ${attrs}>${serverRenderedComponents[id]}</${SLINKITY_REACT_MOUNT_POINT}>\n${loaderScript}`
    })

  if (html.match(ssrRegex)) {
    // if there's more SSR components, there are likely
    // components rendered by other components using shortcodes.
    // recursively render until all SSR comments are resolved.
    return handleSSRComments({
      content: html,
      outputPath,
      componentAttrStore,
      viteSSR,
      renderers,
      importedStyles,
    })
  } else {
    return (
      html
        // inject component styles into head
        .replace(
          SLINKITY_HEAD_STYLES,
          [...importedStyles]
            .map((importedStyle) =>
              importedStyle.match(/&lang.*$/)
                ? // lang.(css|scss|sass...) is used by SFC (single file component) styles
                  // ex. <style scoped> in a .vue file
                  // these are sadly *not* supported by <link> tag imports,
                  // so we'll switch to <script> as a compromise
                  // Note: this does cause FOUC
                  // See this issue log for more details: https://github.com/slinkity/slinkity/issues/84#issuecomment-1003783754
                  `<script ${toHtmlAttrString({ type: 'module', src: importedStyle })}></script>`
                : `<link ${toHtmlAttrString({ rel: 'stylesheet', href: importedStyle })}>`,
            )
            .join('\n'),
        )
    )
  }
}

/**
 * @typedef {import('./types').EleventyConfigParams} EleventyConfigParams
 *
 * @typedef ApplyViteHtmlTransformParams
 * @property {string} content - the original HTML content to transform
 * @property {string} outputPath - the output path this HTML content will be written to
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../cli/types').Renderer[]} renderers
 * @property {EleventyConfigParams['environment']} environment
 * @property {EleventyConfigParams['dir']} dir
 * @property {EleventyConfigParams['viteSSR']} viteSSR
 * @param {ApplyViteHtmlTransformParams}
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
