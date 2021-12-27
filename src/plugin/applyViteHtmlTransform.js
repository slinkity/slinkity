const { normalizePath } = require('vite')
const { relative } = require('path')
const { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT, toSSRComment } = require('../utils/consts')
const { toRendererHtml } = require('./reactPlugin/1-pluginDefinitions/toRendererHtml')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const toLoaderScript = require('./reactPlugin/2-pageTransform/toLoaderScript')
const toHtmlAttrString = require('../utils/toHtmlAttrString')

const ssrRegex = RegExp(toSSRComment('([0-9]+)'), 'g')

/**
 * @typedef ApplyViteHtmlTransformParams
 * @property {string} content - the original HTML content to transform
 * @property {string} outputPath - the output path this HTML content will be written to
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @param {ApplyViteHtmlTransformParams}
 * @param {import('.').SlinkityConfigOptions}
 * @returns {Promise<string>} - HTML with statically rendered content and Vite transforms applied
 */
async function applyViteHtmlTransform(
  { content, outputPath, componentAttrStore },
  { environment, viteSSR, dir },
) {
  if (!outputPath || !outputPath.endsWith('.html')) {
    return content
  }

  /** @type {Set<string>} */
  const importedStyles = new Set()
  // TODO: apply importedStyles as `<link>` tags in `<head>` via indexHtmlTransform
  const allComponentAttrs = componentAttrStore.getAllByPage(outputPath)
  const allComponents = []
  for (const componentAttrs of allComponentAttrs) {
    const { path: componentPath, props, hydrate } = componentAttrs
    const { default: Component, __importedStyles } = await viteSSR.toCommonJSModule(componentPath)
    __importedStyles.forEach((importedStyle) => importedStyles.add(importedStyle))
    // TODO: abstract renderer imports to be framework-agnostic
    // (importing directly from the React plugin right now)
    allComponents.push(
      toRendererHtml({
        Component,
        props,
        hydrate,
      }),
    )
  }

  const html = content.replace(ssrRegex, (_, id) => {
    const componentAttrs = allComponentAttrs[id]
    if (componentAttrs) {
      const { path: componentPath, props, hydrate } = componentAttrs
      const script = toLoaderScript({ componentPath, props, hydrate, id })
      const attrs = toHtmlAttrString({ [SLINKITY_ATTRS.id]: id })
      return `<${SLINKITY_REACT_MOUNT_POINT} ${attrs}>\n\t${allComponents[id]}\n</${SLINKITY_REACT_MOUNT_POINT}>\n${script}`
    } else {
      throw `Failed to find component attributes for ${id}`
    }
  })

  const server = viteSSR.getServer()
  const routePath = '/' + toSlashesTrimmed(normalizePath(relative(dir.output, outputPath)))
  return environment === 'dev' && server ? server.transformIndexHtml(routePath, html) : html
}

module.exports = { applyViteHtmlTransform }
