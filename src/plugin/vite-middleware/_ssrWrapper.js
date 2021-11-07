import { extname } from 'path'

async function any(extensions, componentPath) {
  for (const extension of extensions) {
    try {
      const result = await import(`${componentPath}.${extension}`)
      return result
    } catch {}
  }
  return null
}

/**
 * A wrapper for dynamically importing both
 * - the server renderer found under serverPath
 * - the Component module found under component Path
 * And passing this Component module to the server
 * This avoids the need for compiling every Component to a node-friendly module
 * (i.e. vite.ssrLoadModule), since the entire ssrWrapper to processed by Vite
 * TODO: investigate whether these dynamic imports for server renderers are cached for performance
 *
 * @typedef {import('../../main/defineConfig').RenderToStaticMarkupParams} RenderToStaticMarkupParams
 * @typedef SSRWrapperParams
 * @property {string} serverPath Absolute path to the server renderer
 * @property {string} componentPath Absolute path to the Component module
 *
 * @typedef SSRWrapperReturn
 * @property {(props: Omit<RenderToStaticMarkupParams, 'Component'>) => { html: string; css: string; }} renderToStaticMarkup
 *
 * @param {SSRWrapperParams}
 * @returns {SSRWrapperReturn}
 */
export async function ssrWrapper({ server, extensions, componentPath }) {
  let Component = extname(componentPath)
    ? await import(componentPath)
    : await any(extensions, componentPath)

  const renderToStaticMarkup = server?.renderToStaticMarkup ?? server?.default?.renderToStaticMarkup
  if (typeof renderToStaticMarkup !== 'function') {
    // TODO: come up with better error types
    throw `Slinkity: Attempted to render "${componentPath}" with an invalid renderer! Make sure your renderer exports a "renderToStaticMarkup" function as a named export.`
  }
  return {
    async renderToStaticMarkup(props) {
      console.log({ Component })
      const result = await renderToStaticMarkup({ Component, ...props })
      return {
        html: result.html ?? '',
        css: result.css ?? '',
      }
    },
  }
}
