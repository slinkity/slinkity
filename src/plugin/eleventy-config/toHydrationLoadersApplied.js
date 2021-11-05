const { parse } = require('node-html-parser')
const { applyHtmlWrapper } = require('./applyHtmlWrapper')
const { toLoaderScript } = require('./toLoaderScript')
const { log } = require('../../utils/logger')

// TODO: remove this (or remove everything React-specific)
const webComponentLoader = ''

const errorMessage = ({
  inputPath,
  stacktrace,
}) => `We failed to render components used in file ${inputPath}
We recommend trying to:
1. delete your output directory and restart the server / build
2. clear your node_modules and running a clean install with "npm i"

Visit https://slinkity.dev to review our changelogs!
Stacktrace:
${stacktrace}`

/**
 * Applies all necessary scripts to an HTML document for clientside hydration
 * 1. Looks for any mount points applied by component pages and shortcodes
 * 2. Applies the appropriate loader `<script>` for each (eager or lazy)
 * 3. Appends the mount point web component declaration as a `<script>`
 * 4. Applies all styles imported by components as ES modules using inline `<style>` tags
 *
 * @typedef HydrationLoadersAppliedParams
 * @property {string} content - markup template content passed by 11ty's HTML transform
 * @property {import('../../componentAttrStore').ComponentAttrs[]} componentAttrs - all component attributes used for rendering and hydration
 * @property {Record<string, import('../../../main/defineConfig').Renderer>} rendererMap - map of renderer names to definitions
 * @property {import('../../index').SlinkityConfigOptions['dir']} dir - input and output directories
 *
 * @param {HydrationLoadersAppliedParams}
 * @returns {string} output markup with every component's inline styles and hydration scripts applied
 */
async function toHydrationLoadersApplied({ content, componentAttrs, dir, rendererMap }) {
  const root = parse(content)
  applyHtmlWrapper(root)

  try {
    // Generate scripts to hydrate those components
    const scripts = componentAttrs.map(
      ({ path: componentPath, hydrate, id, props, rendererName }) =>
        toLoaderScript({
          componentPath,
          rendererPath: rendererMap[rendererName].client,
          hydrate,
          id,
          props,
        }),
    )

    root.querySelector('body').insertAdjacentHTML('beforeend', scripts.join('\n'))
  } catch (e) {
    // we silently fail so our error logs aren't buried by 11ty's
    // TODO: handle Slinkity-specific exceptions at the CLI level
    // so we can stop living in fear of exceptions
    if (e?.message) {
      log({
        type: 'error',
        message: errorMessage({ inputPath: dir.input, stacktrace: e.message }),
      })
    }
    return root.outerHTML
  }
  return root.outerHTML
}

module.exports = {
  toHydrationLoadersApplied,
  webComponentLoader,
}
