const { toSSRComment, SLINKITY_REACT_MOUNT_POINT, SLINKITY_ATTRS } = require('../utils/consts')
const { toRendererHtml } = require('./reactPlugin/1-pluginDefinitions/toRendererHtml')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const { relative } = require('path')
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

  const allComponentAttrs = componentAttrStore.getAllByPage(outputPath)
  const pageStyles = {}
  const allComponents = await Promise.all(
    allComponentAttrs.map(async (componentAttrs) => {
      const { path: componentPath, props, hydrate } = componentAttrs
      const { default: Component, __stylesGenerated } = await viteSSR.toCommonJSModule(
        componentPath,
      )
      Object.assign(pageStyles, __stylesGenerated)
      // TODO: abstract renderer imports to be framework-agnostic
      // (importing directly from the React plugin right now)
      return toRendererHtml({
        Component,
        props,
        hydrate,
      })
    }),
  )

  const cssValues = Object.values(pageStyles)
  const styles = cssValues.length ? `<style>${cssValues.join('\n')}</style>\n` : ''

  const html = content.replace(ssrRegex, (_, id) => {
    const componentAttrs = allComponentAttrs[id]
    if (componentAttrs) {
      const { path: componentPath, props, hydrate } = componentAttrs
      const script = toLoaderScript({ componentPath, props, hydrate, id })
      const attrs = toHtmlAttrString({ [SLINKITY_ATTRS.id]: id })
      return `${styles}<${SLINKITY_REACT_MOUNT_POINT} ${attrs}>\n\t${allComponents[id]}\n</${SLINKITY_REACT_MOUNT_POINT}>\n${script}`
    } else {
      throw `Failed to find component attributes for ${id}`
    }
  })

  const server = viteSSR.getServer()
  const routePath = '/' + toSlashesTrimmed(relative(dir.output, outputPath))
  return environment === 'dev' && server ? server.transformIndexHtml(routePath, html) : html
}

module.exports = { applyViteHtmlTransform }
