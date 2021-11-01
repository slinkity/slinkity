/**
 * @typedef ApplyViteHtmlTransformParams
 * @property {string} content - the original HTML content to transform
 * @property {string} outputPath - the output path this HTML content will be written to
 * @param {ApplyViteHtmlTransformParams}
 * @returns {string} - HTML with statically rendered content and Vite transforms applied
 */
async function applyViteHtmlTransform({ content, outputPath, componentAttrStore }) {
  if (!outputPath.endsWith('.html')) return content

  const root = parse(content)
  const mountPointsToSSR = root.querySelectorAll(`[${SLINKITY_ATTRS.ssr}="true"]`)
  const allComponentAttrsForPage = componentAttrStore.getAllByPage(outputPath)
  const pageStyles = {}
  for (const mountPointToSSR of mountPointsToSSR) {
    const id = mountPointToSSR.getAttribute(SLINKITY_ATTRS.id)
    const componentAttrs = allComponentAttrsForPage[id]
    if (componentAttrs) {
      const { path: componentPath, props, hydrate } = componentAttrs
      const { default: Component, __stylesGenerated } = await viteSSR.toComponentCommonJSModule(
        componentPath,
      )
      Object.assign(pageStyles, __stylesGenerated)
      // TODO: abstract renderer imports to be framework-agnostic
      // (importing directly from the React plugin right now)
      mountPointToSSR.innerHTML = toRendererHtml({
        Component,
        props,
        hydrate,
      })
    }
  }
  root
    .querySelector('body')
    ?.insertAdjacentHTML('beforeend', `<style>${Object.values(pageStyles).join('\n')}</style>`)

  const routePath = '/' + toSlashesTrimmed(relative(dir.output, outputPath))
  return environment === 'dev'
    ? viteSSR.server.transformIndexHtml(routePath, root.outerHTML)
    : root.outerHTML
}

module.exports = { applyViteHtmlTransform }
