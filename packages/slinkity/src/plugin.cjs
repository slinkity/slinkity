const fs = require('fs')
const path = require('path')
const vite = require('vite')
const devalue = require('devalue')
const { outputFile } = require('fs-extra')
const { v4: uuidv4, v5: uuidv5 } = require('uuid')
const {
  toSsrComment,
  toPropComment,
  toResolvedIslandPath,
  toClientPropsPathFromOutputPath,
  extractPropIdsFromHtml,
  SlinkityInternalError,
} = require('./utils.cjs')
const { defineConfig } = require('./defineConfig.cjs')
const { BUILD_ID } = require('./consts.cjs')

/** @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig */
module.exports = function slinkityPlugin(eleventyConfig, unresolvedUserConfig) {
  /** @type {import('vite').ViteDevServer} */
  let viteServer

  /** @type {import('./@types').PropsByInputPath} */
  const propsByInputPath = new Map()

  /** @type {import('./@types').SsrIslandsByInputPath} */
  const ssrIslandsByInputPath = new Map()

  /** @type {import('./@types').UrlToRenderedContentMap} */
  const urlToRenderedContentMap = new Map()

  const userConfig = defineConfig(unresolvedUserConfig)

  const extToRendererMap = new Map(
    userConfig.renderers
      .map((renderer) => renderer.extensions.map((ext) => [ext, renderer]))
      .flat(),
  )

  // TODO: find way to flip back on
  // When set to "true," Vite will try to resolve emulated copies via middleware.
  // These don't exist in _site since 11ty manages via memory,
  // so Vite blows up!
  eleventyConfig.setServerPassthroughCopyBehavior(false)

  eleventyConfig.on('eleventy.after', async function ({ results, runMode }) {
    if (runMode === 'serve') {
      for (let { content, inputPath, url } of results) {
        // used for serving content within dev server middleware
        urlToRenderedContentMap.set(url, {
          content,
          inputPath,
        })
      }
    }
  })

  /**
   * Replace SSR comments with rendered component content
   * @typedef HandleSsrComments
   * @param {import('./@types').RenderedContent} renderedContent
   * @returns {Promise<string>}
   */
  async function handleSsrComments({ content, inputPath }) {
    const islands = ssrIslandsByInputPath.get(inputPath)
    const ssrRegex = new RegExp(toSsrComment('(.*)'), 'g')
    const ssrMatches = [...content.matchAll(ssrRegex)]
    const ssrContentByIslandId = new Map()

    await Promise.all(
      ssrMatches.map(async ([, islandId]) => {
        if (islands[islandId]) {
          const { islandPath, propIds } = islands[islandId]
          const islandExt = path.extname(islandPath).replace(/^\./, '')
          if (!islandExt) {
            throw new Error(
              `Missing file extension on ${JSON.stringify(islandRenderer)} in ${JSON.stringify(
                inputPath,
              )}! Please add a file extension, like ${JSON.stringify(
                `${islandPath}.${extToRendererMap.keys()[0] ?? 'jsx'}`,
              )})`,
            )
          }
          const islandRenderer = extToRendererMap.get(islandExt)
          if (!islandRenderer?.ssr) {
            throw new Error(
              `No SSR renderer found for ${JSON.stringify(islandPath)} in ${JSON.stringify(
                inputPath,
              )}! Please add a render to your Slinkity plugin config. See https://slinkity.dev/docs/component-shortcodes/#prerequisites for more.`,
            )
          }
          const Component = await viteServer.ssrLoadModule(islandPath)

          const propsById = propsByInputPath.get(inputPath)?.props ?? {}
          const props = {}
          for (let propId of propIds) {
            const { name, value } = propsById[propId]
            props[name] = value
          }

          // TODO: support slots
          const { html } = islandRenderer.ssr({ Component, props })
          ssrContentByIslandId.set(islandId, html)
        } else {
          throw new SlinkityInternalError(`Failed to find island for SSR with id "${islandId}"`)
        }
      }),
    )

    return content.replace(ssrRegex, (_, islandId) => ssrContentByIslandId.get(islandId))
  }

  eleventyConfig.setServerOptions({
    enabled: false,
    domdiff: false,
    async setup() {
      /** @type {import('vite').InlineConfig} */
      let viteConfig = {
        root: '_site',
        clearScreen: false,
        appType: 'custom',
        server: {
          middlewareMode: true,
        },
      }

      for (const renderer of userConfig.renderers) {
        viteConfig = vite.mergeConfig(viteConfig, renderer.viteConfig)
      }

      viteServer = await vite.createServer(viteConfig)

      return {
        middleware: [
          viteServer.middlewares,
          async function applyViteHtmlTransform(req, res, next) {
            const page = urlToRenderedContentMap.get(req.url)
            if (page) {
              const html = await handleSsrComments(page)

              res.setHeader('Content-Type', 'text/html')
              res.write(await viteServer.transformIndexHtml(req.url, html))
              res.end()
            } else {
              next()
            }
          },
        ],
      }
    },
  })

  eleventyConfig.addPairedShortcode(
    'serverOnlyIsland',
    function (htmlWithPropComments, unresolvedIslandPath) {
      const islandPath = toResolvedIslandPath(unresolvedIslandPath, userConfig.islandsDir)
      const islandId = uuidv4()

      const { htmlWithoutPropComments: html, propIds } =
        extractPropIdsFromHtml(htmlWithPropComments)

      const { inputPath } = this.page
      const existingSsrComponents = ssrIslandsByInputPath.get(inputPath)
      ssrIslandsByInputPath.set(inputPath, {
        ...existingSsrComponents,
        [islandId]: {
          islandPath,
          propIds,
          slots: { default: html },
        },
      })

      return toSsrComment(islandId)
    },
  )

  eleventyConfig.addShortcode('prop', function (name, value) {
    const { inputPath } = this.page
    let serializedValue, id
    let hasStore = Boolean(propsByInputPath.get(inputPath)?.hasStore)
    if (typeof value === 'object' && value !== null && value.isSlinkityStoreFactory) {
      serializedValue = `new SlinkityStore(${devalue(value.value)})`
      id = value.id
      hasStore = true
    } else {
      serializedValue = devalue(value)
      id = uuidv5(`${name}${serializedValue}`, BUILD_ID)
    }
    const existingPropsOnPage = propsByInputPath.get(inputPath)?.props ?? {}
    propsByInputPath.set(inputPath, {
      hasStore,
      props: {
        ...existingPropsOnPage,
        [id]: { name, value, serializedValue },
      },
    })

    return toPropComment(id)
  })

  eleventyConfig.addTransform('slinkity-create-props-file', async function (content, outputPath) {
    const propInfo = propsByInputPath.get(this.inputPath)
    if (propInfo) {
      const { hasStore, props } = propInfo
      let propsFileContents = 'export default {\n'
      for (const [key, { name, serializedValue }] of Object.entries(props)) {
        const serializedKey = JSON.stringify(key)
        const serializedEntry = `{ name: ${JSON.stringify(name)}, value: ${serializedValue} }`
        propsFileContents += `  ${serializedKey}: ${serializedEntry},\n`
      }
      propsFileContents += '}'
      if (hasStore) {
        propsFileContents += '\n' + (await fs.promises.readFile('./utils/store.client.mjs'))
      }
      const clientPropsPath = path.join(
        eleventyConfig.dir.output,
        toClientPropsPathFromOutputPath(outputPath, eleventyConfig.dir.output),
      )
      await outputFile(clientPropsPath, propsFileContents)
    }

    return content
  })
}
