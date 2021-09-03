const { parse } = require('node-html-parser')
const { join } = require('path')
const { readFile } = require('fs').promises
const applyHtmlWrapper = require('./applyHtmlWrapper')
const { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } = require('../../utils/consts')
const { writeFileRec } = require('../../utils/fileHelpers')
const toLoaderScript = require('./toLoaderScript')
const toClientImportStatement = require('./toClientImportStatement')
const { log } = require('../../utils/logger')

const webComponentLoader = `
<script type="module">
  import MountPoint from ${toClientImportStatement('_mount-point.js')};
  window.customElements.define("${SLINKITY_REACT_MOUNT_POINT}", MountPoint);
</script>`

const errorMessage = ({
  id,
  inputPath,
}) => `We failed to hydrate a mount point with the id ${id} in the file ${inputPath}
We recommend trying to:
1. delete your output directory and restart the server / build
2. clear your node_modules and running a clean install with "npm i"

Visit https://slinkity.dev to review our changelogs!`

/**
 * Applies all necessary scripts to an HTML document for clientside hydration
 * 1. Looks for any mount points applied by component pages and shortcodes
 * 2. Applies the appropriate loader `<script>` for each (eager or lazy)
 * 3. Appends the mount point web component declaration as a `<script>`
 *
 * @param {{
 *   content: string,
 *   componentAttrStore: import('./componentAttrStore').ComponentAttrStore,
 *   dir?: {
 *     input: string,
 *     output: string,
 *   },
 *   isDryRun?: boolean,
 * }} params
 * @returns {string} output HTML content with all hydration scripts applied
 */
async function toHydrationLoadersApplied({ content, componentAttrStore, dir, isDryRun = false }) {
  const root = parse(content)
  applyHtmlWrapper(root)
  const mountPoints = [...root.querySelectorAll(SLINKITY_REACT_MOUNT_POINT)]

  if (mountPoints.length > 0) {
    try {
      // 1. Get the attributes for all mount points on the page
      const hydrationAttrs = mountPoints.map((mountPoint) => {
        const id = mountPoint.getAttribute(SLINKITY_ATTRS.id) || ''
        const componentAttrs = componentAttrStore.get(parseInt(id))
        if (!componentAttrs) {
          throw new Error(errorMessage({ id, inputPath: this.inputPath }))
        }
        return { id, ...componentAttrs }
      })

      // 2. Copy the associated component file to the output dir
      if (!isDryRun && dir) {
        await Promise.all(
          hydrationAttrs.map(async ({ path: componentPath }) => {
            const jsxInputPath = join(dir.input, componentPath)
            const jsxOutputPath = join(dir.output, componentPath)
            await writeFileRec(jsxOutputPath, await readFile(jsxInputPath))
          }),
        )
      }

      // 3. Generate scripts to hydrate our mount points
      const componentScripts = hydrationAttrs.map(({ path: componentPath, hydrate, id, props }) =>
        toLoaderScript({
          componentPath,
          hydrate,
          id,
          props,
        }),
      )

      root
        .querySelector('body')
        .insertAdjacentHTML('beforeend', `${webComponentLoader}${componentScripts.join('')}`)
    } catch (e) {
      // we silently fail so our error logs aren't buried by 11ty's
      // TODO: handle Slinkity-specific exceptions at the CLI level
      // so we can stop living in fear of exceptions
      if (e?.message) {
        log({ type: 'error', message: e.message })
      }
      return root.outerHTML
    }
  }
  return root.outerHTML
}

module.exports = {
  toHydrationLoadersApplied,
  webComponentLoader,
}
