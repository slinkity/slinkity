const path = require('path')
const toFormattedDataForProps = require('../utils/toFormattedDataForProps')
const { toSSRComment } = require('../utils/consts')
const { log } = require('../utils/logger')

/**
 * @typedef AddComponentPagesParams
 * @property {import('./componentAttrStore').ComponentAttrStore} componentAttrStore
 * @property {import('../@types').ViteSSR} viteSSR
 * @property {import('../@types').ImportAliases} importAliases
 * @property {any} eleventyConfig
 * @property {import('../@types').Renderer} renderer
 * @param {AddComponentPagesParams}
 */
module.exports = function addComponentPages({
  renderer,
  eleventyConfig,
  componentAttrStore,
  viteSSR,
  importAliases,
}) {
  if (!renderer.page) return

  let useFormatted11tyData = false
  let getData = () => ({})

  for (const extension of renderer.extensions) {
    eleventyConfig.addExtension(extension, {
      read: false,
      async init() {
        const rendererPageConfig = await renderer.page({
          toCommonJSModule: viteSSR.toCommonJSModule,
        })
        useFormatted11tyData = rendererPageConfig.useFormatted11tyData
        getData = rendererPageConfig.getData
      },
      async getData(inputPath) {
        const absInputPath = path.join(importAliases.root, inputPath)
        return await getData(absInputPath)
      },
      compileOptions: {
        permalink(permalink) {
          const __functions = this
          return function render(data) {
            if (typeof permalink === 'function') {
              return permalink({ ...data, __functions })
            } else {
              return permalink
            }
          }
        },
      },
      compile(_, inputPath) {
        const unboundFunctions = this.config?.javascriptFunctions ?? {}
        return async function render(data) {
          // functions should have access to "page" via the "this" keyword
          // this is missing on javascriptFunctions from this scope,
          // so we'll add that binding back on
          const __functions = Object.fromEntries(
            Object.entries(unboundFunctions).map(([name, fn]) => [
              name,
              fn.bind({ page: data.page }),
            ]),
          )
          const absInputPath = path.join(importAliases.root, inputPath)
          let props

          /** @type {{ hydrate: import('../@types').Hydrate }} */
          const loader = data.renderWithoutSSR ?? data.hydrate ?? 'none'
          const isSSR = data.renderWithoutSSR === undefined

          if (typeof loader === 'object' && typeof loader.props === 'function') {
            // if there's a "props" function,
            // use that to determine the component props
            const formattedData = useFormatted11tyData ? toFormattedDataForProps(data) : data
            const formattedDataWithFns = { ...formattedData, __functions }
            props = (await loader.props(formattedDataWithFns)) ?? {}
          } else if (loader === 'none' || loader.mode === 'none') {
            // if there's no "props" function and we don't render the page client-side,
            // pass *all* 11ty data as props
            props = { ...data, __functions }
          } else {
            // if there's no "props" function, but we *do* render the page client-side,
            // don't pass any props
            props = {}
          }

          if (data.render !== undefined) {
            log({
              type: 'warning',
              message: `The "render" prop no longer affects hydration as of v0.6! If you intended to use "render" to hydrate "${inputPath}," try using "hydrate" instead. Also note that pages are no longer hydrated by default. See our docs for more: https://slinkity.dev/docs/component-pages-layouts`,
            })
          }

          const id = componentAttrStore.push({
            path: absInputPath,
            props,
            isSSR,
            loader: loader.mode ? loader.mode : loader,
            pageOutputPath: data.page.url,
            rendererName: renderer.name,
          })

          return toSSRComment(id)
        }
      },
    })
  }
}
