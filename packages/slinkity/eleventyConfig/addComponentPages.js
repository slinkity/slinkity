const path = require('path')
const toFormattedDataForProps = require('../utils/toFormattedDataForProps')
const { toSSRComment } = require('../utils/consts')
const { log } = require('../utils/logger')

/**
 * @typedef AddComponentPagesParams
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../cli/vite').ResolvedImportAliases} resolvedImportAliases
 * @property {import('../cli/toViteSSR').ViteSSR} viteSSR
 * @property {any} eleventyConfig
 * @property {import('../cli/types').Renderer} renderer
 * @param {AddComponentPagesParams}
 */
module.exports = async function addComponentPages({
  renderer,
  eleventyConfig,
  viteSSR,
  componentAttrStore,
  resolvedImportAliases,
}) {
  if (!renderer.page) return

  const { useFormatted11tyData = true, getData } = await renderer.page({
    toCommonJSModule: viteSSR.toCommonJSModule,
  })

  for (const extension of renderer.extensions) {
    eleventyConfig.addExtension(extension, {
      read: false,
      async getData(inputPath) {
        const absInputPath = path.join(resolvedImportAliases.root, inputPath)
        return await getData(absInputPath)
      },
      compileOptions: {
        permalink() {
          return function render({ permalink, ...data }) {
            if (typeof permalink === 'function') {
              return permalink(data)
            } else {
              return permalink
            }
          }
        },
      },
      compile(_, inputPath) {
        const unboundShortcodes = this.config?.javascriptFunctions ?? {}
        return async function render(data) {
          // shortcodes should have access to "page" via the "this" keyword
          // this is missing on javascriptFunctions from this scope for some reason,
          // so we'll add that binding back on
          const shortcodes = Object.fromEntries(
            Object.entries(unboundShortcodes).map(([name, fn]) => [
              name,
              fn.bind({ page: data.page }),
            ]),
          )
          const absInputPath = path.join(resolvedImportAliases.root, inputPath)
          let props

          /** @type {{ hydrate: import('../cli/types').Hydrate }} */
          const { hydrate = 'none' } = data
          if (typeof hydrate !== 'string' && typeof hydrate.props === 'function') {
            // if there's a "props" function,
            // use that to determine the component props
            const dataForProps = useFormatted11tyData ? toFormattedDataForProps(data) : data
            const dataWithShortcodes = {
              ...dataForProps,
              __slinkity: {
                ...(dataForProps.__slinkity || {}),
                shortcodes,
              },
            }
            props = (await hydrate.props(dataWithShortcodes)) ?? {}
          } else if (hydrate === 'none' || hydrate.mode === 'none') {
            // if there's no "props" function and we don't hydrate the page,
            // pass *all* 11ty data as props
            props = {
              ...data,
              __slinkity: {
                ...(data.__slinkity || {}),
                shortcodes,
              },
            }
          } else {
            // if there's no "props" function, but we *do* hydrate the page,
            // don't pass any props
            props = {}
          }

          if (data.render !== undefined) {
            log({
              type: 'warning',
              message: `The "render" prop no longer affects hydration as of v0.6! If you intended to use "render" to hydrate the component page at "${inputPath}," try using "hydrate" instead. See our docs for more: https://slinkity.dev/docs/component-pages-layouts`,
            })
          }

          const id = componentAttrStore.push({
            path: absInputPath,
            props,
            hydrate: hydrate.mode ? hydrate.mode : hydrate,
            pageOutputPath: data.page.outputPath,
            rendererName: renderer.name,
          })

          return toSSRComment(id)
        }
      },
    })
  }
}
