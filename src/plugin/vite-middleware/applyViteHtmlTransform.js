const { parse } = require('node-html-parser')
const { SLINKITY_ATTRS } = require('../../utils/consts')
const toSlashesTrimmed = require('../../utils/toSlashesTrimmed')
const { relative, resolve } = require('path')

/**
 * @typedef ApplyViteHtmlTransformParams
 * @property {string} content The original HTML content to transform
 * @property {string} outputPath The output path this HTML content will be written to
 * @property {import('../componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {Record<string, import('../../main/defineConfig').Renderer>} rendererMap
 * @param {ApplyViteHtmlTransformParams}
 *
 * @param {import('../').SlinkityConfigOptions}
 * @returns {string} HTML with statically rendered content and Vite transforms applied
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
      const { ssrWrapper } = await viteSSR.toCommonJSModule(resolve(__dirname, '_ssrWrapper.js'))
      const server = await viteSSR.toCommonJSModule(rendererMap[rendererName].server)
      /**
       * @type {import('./_ssrWrapper').SSRWrapperReturn}
       */
      const { renderToStaticMarkup } = await ssrWrapper({
        componentPath,
        extensions: rendererMap[rendererName].extensions,
        server,
      })
      // TODO: handle "css" output from server renderer
      const markup = await renderToStaticMarkup({
        props,
        children: '',
        hydrate,
      })
      mountPointToSSR.innerHTML = markup.html
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
