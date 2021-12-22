const { parse } = require('node-html-parser')
const { SLINKITY_ATTRS, toSSRComment } = require('../utils/consts')
const { toRendererHtml } = require('./reactPlugin/1-pluginDefinitions/toRendererHtml')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const { relative } = require('path')

const ssrRegex = RegExp(toSSRComment('([0-9]+)'), 'g')

/**
 * @typedef ApplyViteHtmlTransformParams
 * @property {string} content - the original HTML content to transform
 * @property {string} outputPath - the output path this HTML content will be written to
 * @property {ComponentAttri} componentAttrStore
 * @param {ApplyViteHtmlTransformParams}
 * @param {import('.').SlinkityConfigOptions}
 * @returns {string} - HTML with statically rendered content and Vite transforms applied
 */
async function applyViteHtmlTransform(
  { content, outputPath, componentAttrStore },
  { dir, viteSSR, environment },
) {
  if (!outputPath || !outputPath.endsWith('.html')) {
    return content
  }

  const allComponentAttrs = componentAttrStore.getAllByPage(outputPath)
  const componentIdsOnPage = [...content.matchAll(ssrRegex)].map(([, id]) => id)
  const html = componentIdsOnPage.reduce(function (html, componentId) {
    console.log({ componentId })
    const componentAttrs = allComponentAttrs[componentId]
    if (componentAttrs) {
      const { path: componentPath, props, hydrate } = componentAttrs
      // TODO: actually render
    }
  })

  const root = parse(content)
  const mountPointsToSSR = root.querySelectorAll(`[${SLINKITY_ATTRS.ssr}="true"]`)
  const allComponentAttrsForPage = componentAttrStore.getAllByPage(outputPath)
  const pageStyles = {}
  for (const mountPointToSSR of mountPointsToSSR) {
    const id = mountPointToSSR.getAttribute(SLINKITY_ATTRS.id)
    const componentAttrs = allComponentAttrsForPage[id]
    if (componentAttrs) {
      const { path: componentPath, props, hydrate } = componentAttrs
      const { default: Component, __stylesGenerated } = await viteSSR.toCommonJSModule(
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
  const server = viteSSR.getServer()
  return environment === 'dev' && server
    ? server.transformIndexHtml(routePath, root.outerHTML)
    : root.outerHTML
}

module.exports = { applyViteHtmlTransform }
