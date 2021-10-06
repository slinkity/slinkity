const { parse } = require('node-html-parser')
const { join } = require('path')
const { readFile } = require('fs').promises
const applyHtmlWrapper = require('./applyHtmlWrapper')
const { SLINKITY_REACT_MOUNT_POINT } = require('../../../utils/consts')
const { writeFileRec } = require('../../../utils/fileHelpers')
const toLoaderScript = require('./toLoaderScript')
const toClientImportStatement = require('./toClientImportStatement')
const { log } = require('../../../utils/logger')

const webComponentLoader = `
<script type="module">
  import MountPoint from ${toClientImportStatement('_mount-point.js')};
  window.customElements.define("${SLINKITY_REACT_MOUNT_POINT}", MountPoint);
</script>`

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
 * @property {import('../../componentAttrStore').ComponentAttrsWithId[]} componentAttrs - all component attributes used for rendering and hydration
 * @property {import('../../index').PluginOptions['dir']} dir - input and output directories
 * @property {boolean?} isDryRun - whether to write components to output directory. When isDryRun = true, no file system actions will occur
 *
 * @param {HydrationLoadersAppliedParams}
 * @returns {string} output markup with every component's inline styles and hydration scripts applied
 */
async function toHydrationLoadersApplied({ content, componentAttrs, dir, isDryRun = false }) {
  const root = parse(content)
  applyHtmlWrapper(root)

  try {
    // 2. Copy the associated component file to the output dir
    if (!isDryRun && dir) {
      await Promise.all(
        componentAttrs.map(async ({ path: componentPath }) => {
          const jsxInputPath = join(dir.input, componentPath)
          const jsxOutputPath = join(dir.output, componentPath)
          await writeFileRec(jsxOutputPath, await readFile(jsxInputPath))
        }),
      )
    }

    // 3. Generate scripts to hydrate those components
    const scripts = componentAttrs.map(({ path: componentPath, hydrate, id, props }) =>
      toLoaderScript({
        componentPath,
        hydrate,
        id,
        props,
      }),
    )

    root
      .querySelector('body')
      .insertAdjacentHTML(
        'beforeend',
        [...(componentAttrs.length ? [webComponentLoader] : []), ...scripts].join('\n'),
      )
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
