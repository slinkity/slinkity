const fs = require('fs')
const path = require('path')
const { outputFile } = require('fs-extra')
const {
  toSsrComment,
  toClientPropsPathFromOutputPath,
  SlinkityInternalError,
  toIslandExt,
  collectCSS,
} = require('./utils.cjs')
const { createViteServer } = require('./viteServer.cjs')
const { defineConfig } = require('./defineConfig.cjs')
const shortcodes = require('./shortcodes.cjs')

/**
 * @param {import('@11ty/eleventy/src/UserConfig')} eleventyConfig
 * @param {import('./@types').UserConfig} unresolvedUserConfig
 */
module.exports = function slinkityPlugin(eleventyConfig, unresolvedUserConfig) {
  /** @type {import('./@types').PropsByInputPath} */
  const propsByInputPath = new Map()

  /** @type {import('./@types').SsrIslandsByInputPath} */
  const ssrIslandsByInputPath = new Map()

  /** @type {Map<string, Set<string>>} */
  const cssUrlsByInputPath = new Map()

  /** @type {import('./@types').UrlToRenderedContentMap} */
  const urlToRenderedContentMap = new Map()

  const userConfig = defineConfig(unresolvedUserConfig)

  /** @type {import('./@types').ExtToRendererMap} */
  const extToRendererMap = new Map(
    userConfig.renderers
      .map((renderer) => renderer.extensions.map((ext) => [ext, renderer]))
      .flat(),
  )

  const viteServer = createViteServer({ userConfig, cssUrlsByInputPath })

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

  shortcodes(eleventyConfig, userConfig, {
    ssrIslandsByInputPath,
    propsByInputPath,
    extToRendererMap,
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
          const islandExt = toIslandExt(islandPath)
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
          const Component = await viteServer.get().ssrLoadModule(islandPath)
          const moduleGraph = await viteServer.get().moduleGraph.getModuleByUrl(islandPath)
          const collectedCssUrls = new Set()
          collectCSS(moduleGraph, collectedCssUrls)

          cssUrlsByInputPath.set(inputPath, collectedCssUrls)

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
      const server = viteServer.get() ?? (await viteServer.init())
      return {
        middleware: [
          server.middlewares,
          async function applyViteHtmlTransform(req, res, next) {
            const page = urlToRenderedContentMap.get(req.url)
            if (page) {
              const html = await handleSsrComments(page)

              res.setHeader('Content-Type', 'text/html')
              res.write(await server.transformIndexHtml(req.url, html, page.inputPath))
              res.end()
            } else {
              next()
            }
          },
        ],
      }
    },
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
