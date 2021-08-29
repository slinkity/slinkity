const { parse } = require('node-html-parser')
const { join } = require('path')
const { readFile } = require('fs').promises
const { stringify } = require('javascript-stringify')
const applyHtmlWrapper = require('./applyHtmlWrapper')
const toHtmlAttrString = require('../../utils/toHtmlAttrString')
const { SLINKITY_ATTRS, SLINKITY_REACT_MOUNT_POINT } = require('../../utils/consts')
const { writeFileRec } = require('../../utils/fileHelpers')
const toUnixPath = require('../../utils/toUnixPath')

const SLINKITY_REACT_MOUNT_POINT_PATH =
  'slinkity/lib/plugin/reactPlugin/_slinkity-react-mount-point.js'

const webComponentLoader = `
<script type="module">
  import MountPoint from ${JSON.stringify(SLINKITY_REACT_MOUNT_POINT_PATH)};
  window.customElements.define("${SLINKITY_REACT_MOUNT_POINT}", MountPoint);
</script>`

/**
 * Applies all necessary scripts to an HTML document for clientside hydration
 * 1. Looks for any mount points applied by component pages and shortcodes
 * 2. Applies the appropriate loader `<script>` for each (eager or lazy)
 * 3. Appends the mount point web component declaration as a `<script>`
 *
 * @param {{
 *   content: string,
 *   componentToPropsMap: Object.<string, any>,
 *   dir?: {
 *     input: string,
 *     output: string,
 *   },
 *   isDryRun?: boolean,
 * }} params
 * @returns {string} output HTML content with all hydration scripts applied
 */
async function toHydrationLoadersApplied({ content, componentToPropsMap, dir, isDryRun = false }) {
  const root = parse(content)
  applyHtmlWrapper(root)
  const mountPoints = [...root.querySelectorAll(SLINKITY_REACT_MOUNT_POINT)]

  if (mountPoints.length > 0) {
    // 1. Record the "instance" index for each mount point on the page
    // This is used to match up scripts to mount points later
    mountPoints.forEach((mountPoint, index) => {
      mountPoint.setAttribute(SLINKITY_ATTRS.instance, `${index}`)
    })

    // 2. Get the attributes for all mount points on the page
    const rendererAttrs = mountPoints.map((mountPoint) => ({
      [SLINKITY_ATTRS.path]: mountPoint.getAttribute(SLINKITY_ATTRS.path) || '',
      [SLINKITY_ATTRS.instance]: mountPoint.getAttribute(SLINKITY_ATTRS.instance) || '',
      [SLINKITY_ATTRS.lazy]: mountPoint.getAttribute(SLINKITY_ATTRS.lazy) === 'true',
    }))

    // 3. Copy the associated component file to the output dir
    if (!isDryRun && dir) {
      await Promise.all(
        rendererAttrs.map(async ({ [SLINKITY_ATTRS.path]: componentPath }) => {
          const jsxInputPath = join(dir.input, componentPath)
          const jsxOutputPath = join(dir.output, componentPath)
          await writeFileRec(jsxOutputPath, await readFile(jsxInputPath))
        }),
      )
    }

    // 4. Generate scripts to hydrate our mount points
    const componentScripts = rendererAttrs.map(
      ({
        [SLINKITY_ATTRS.path]: componentPath,
        [SLINKITY_ATTRS.instance]: instance,
        [SLINKITY_ATTRS.lazy]: isLazy = false,
      }) => {
        // TODO: abstract "props" to some other file, instead of stringifying in-place
        // We could be generating identical, large prop blobs
        const loadScript = `<script type="module">
            import { renderComponent } from ${JSON.stringify(SLINKITY_REACT_MOUNT_POINT_PATH)};
            import Component from ${JSON.stringify('/' + toUnixPath(componentPath))};
            renderComponent({
              Component,
              componentPath: ${JSON.stringify(toUnixPath(componentPath))},
              instance: "${instance}",
              props: ${stringify(componentToPropsMap[componentPath] ?? {})},
            });
          </script>`
        if (isLazy) {
          const attrs = toHtmlAttrString({
            [SLINKITY_ATTRS.path]: componentPath,
            [SLINKITY_ATTRS.instance]: instance,
          })
          // wrap "lazy" components in a template so we can load them later
          return `<template ${attrs}>${loadScript}</template>`
        } else {
          return loadScript
        }
      },
    )

    root.querySelector('body').insertAdjacentHTML(
      'beforeend',
      `
${webComponentLoader}
${componentScripts.join('')}
		`,
    )
  }
  return root.outerHTML
}

module.exports = {
  toHydrationLoadersApplied,
  webComponentLoader,
}
