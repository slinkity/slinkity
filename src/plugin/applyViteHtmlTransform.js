const { parse } = require('node-html-parser')
const { SLINKITY_ATTRS } = require('../utils/consts')
const { toRendererHtml } = require('./reactPlugin/1-pluginDefinitions/toRendererHtml')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const { relative } = require('path')

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

  const root = parse(content)
  const mountPointsToSSR = root.querySelectorAll(`[${SLINKITY_ATTRS.ssr}="true"]`)
  const allComponentAttrsForPage = componentAttrStore.getAllByPage(outputPath)
  /** @type {Set<string>} */
  const importedStyles = new Set()
  for (const mountPointToSSR of mountPointsToSSR) {
    const id = mountPointToSSR.getAttribute(SLINKITY_ATTRS.id)
    const componentAttrs = allComponentAttrsForPage[id]
    if (componentAttrs) {
      const { path: componentPath, props, hydrate } = componentAttrs
      const { default: Component, __importedStyles } = await viteSSR.toCommonJSModule(componentPath)
      __importedStyles.forEach((importedStyle) => importedStyles.add(importedStyle))
      // TODO: abstract renderer imports to be framework-agnostic
      // (importing directly from the React plugin right now)
      mountPointToSSR.innerHTML = toRendererHtml({
        Component,
        props,
        hydrate,
      })
    }
  }
  if (importedStyles.size) {
    root
      .querySelector('head')
      .insertAdjacentHTML(
        'beforeend',
        [...importedStyles]
          .map(
            (importedStyle) =>
              `<link rel="stylesheet" href=${JSON.stringify(importedStyle)}></link>`,
          )
          .join('\n'),
      )
  }

  const routePath = '/' + toSlashesTrimmed(relative(dir.output, outputPath))
  const server = viteSSR.getServer()
  return environment === 'dev' && server
    ? server.transformIndexHtml(routePath, root.outerHTML)
    : root.outerHTML
}

module.exports = { applyViteHtmlTransform }
