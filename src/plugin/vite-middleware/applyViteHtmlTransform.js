const { parse } = require('node-html-parser')
const { SLINKITY_ATTRS } = require('../../utils/consts')
const toSlashesTrimmed = require('../../utils/toSlashesTrimmed')
const { relative, extname } = require('path')

/**
 * @typedef ApplyViteHtmlTransformParams
 * @property {string} content - the original HTML content to transform
 * @property {string} outputPath - the output path this HTML content will be written to
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {Record<string, import('../main/defineConfig').Renderer>} rendererMap
 * @param {ApplyViteHtmlTransformParams}
 *
 * @param {import('.').SlinkityConfigOptions}
 * @returns {string} - HTML with statically rendered content and Vite transforms applied
 */
module.exports.applyViteHtmlTransform = async function (
  { content, outputPath, componentAttrStore, rendererMap },
  { dir, viteSSR, environment },
) {
  if (!outputPath || !outputPath.endsWith('.html')) {
    return content
  }

  const root = parse(content)
  const mountPointsToSSR = root.querySelectorAll(`[${SLINKITY_ATTRS.ssr}="true"]`)
  const allComponentAttrsForPage = componentAttrStore.getAllByPage(outputPath)
  const pageStyles = {}
  for (const mountPointToSSR of mountPointsToSSR) {
    const id = mountPointToSSR.getAttribute(SLINKITY_ATTRS.id)
    const componentAttrs = allComponentAttrsForPage[parseInt(id)]
    if (componentAttrs) {
      const { path: componentPath, props, hydrate, rendererName } = componentAttrs
      const { __stylesGenerated, ...loadedModule } = await viteSSR.toCommonJSModule(componentPath)
      Object.assign(pageStyles, __stylesGenerated)
      // TODO: abstract renderer imports to be framework-agnostic
      // (importing directly from the React plugin right now)
      mountPointToSSR.innerHTML = rendererMap[rendererName].server({
        loadedModule,
        hydrate,
        props,
        innerHTMLString: '',
        extension: extname(componentPath),
      })
    }
  }
  root
    .querySelector('body')
    ?.insertAdjacentHTML('beforeend', `<style>${Object.values(pageStyles).join('\n')}</style>`)

  const routePath = '/' + toSlashesTrimmed(relative(dir.output, outputPath))
  const server = viteSSR.getServer()
  return environment === 'dev' && server
    ? server.transformIndexHtml(routePath, root.outerHTML)
    : root.outerHTML
}
