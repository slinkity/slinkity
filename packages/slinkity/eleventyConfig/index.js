const { normalizePath } = require('vite')
const { relative } = require('path')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const { getResolvedAliases } = require('../cli/vite')
const { toComponentAttrStore } = require('./componentAttrStore')
const { applyViteHtmlTransform, isSupportedOutputPath } = require('./applyViteHtmlTransform')
const addComponentPages = require('./addComponentPages')
const addComponentShortcodes = require('./addComponentShortcodes')
const { SLINKITY_HEAD_STYLES } = require('../utils/consts')
const { toEleventyIgnored, defaultExtensions } = require('./handleTemplateExtensions')

/**
 * @typedef {import('../@types').EleventyConfigParams} EleventyConfigParams
 */

/**
 * @param {EleventyConfigParams} options - all Slinkity plugin options
 * @returns (eleventyConfig: Object) => Object - config we'll apply to the Eleventy object
 */
module.exports = function toEleventyConfig({ userSlinkityConfig, ...options }) {
  const { dir, viteSSR, environment } = options

  /** @type {import('./handleTemplateExtensions').ExtensionMeta[]} */
  const ignoredFromRenderers = userSlinkityConfig.renderers.flatMap((renderer) =>
    renderer.extensions.map((extension) => ({
      extension,
      isTemplateFormat: typeof renderer.page === 'function',
      isIgnoredFromIncludes: true,
    })),
  )
  const extensionMeta = [...defaultExtensions, ...ignoredFromRenderers]
  const eleventyIgnored = toEleventyIgnored(userSlinkityConfig.eleventyIgnores, dir, extensionMeta)
  const componentAttrStore = toComponentAttrStore()

  return function (eleventyConfig) {
    eleventyConfig.addTemplateFormats(
      extensionMeta.filter((ext) => ext.isTemplateFormat).map((ext) => ext.extension),
    )
    for (const ignored of eleventyIgnored) {
      eleventyConfig.ignores.add(ignored)
    }

    eleventyConfig.addGlobalData('__slinkity', {
      head: SLINKITY_HEAD_STYLES,
    })

    const resolvedImportAliases = getResolvedAliases(dir)
    addComponentShortcodes({
      renderers: userSlinkityConfig.renderers,
      eleventyConfig,
      resolvedImportAliases,
      componentAttrStore,
    })
    for (const renderer of userSlinkityConfig.renderers) {
      if (renderer.page) {
        addComponentPages({
          renderer,
          viteSSR,
          eleventyConfig,
          resolvedImportAliases,
          componentAttrStore,
        })
      }
    }

    if (environment === 'development') {
      /** @type {Record<string, string>} */
      const urlToViteTransformMap = {}
      /** @type {import('vite').ViteDevServer} */
      let viteMiddlewareServer = null

      eleventyConfig.setServerOptions({
        async setup() {
          if (!viteMiddlewareServer) {
            viteMiddlewareServer = await viteSSR.createServer()
          }
        },
        middleware: [
          (...args) => {
            return viteMiddlewareServer.middlewares(...args)
          },
          async function viteTransformMiddleware(req, res, next) {
            const page = urlToViteTransformMap[toSlashesTrimmed(req.url)]
            if (page) {
              const { content, outputPath } = page
              res.write(
                await applyViteHtmlTransform({
                  content,
                  outputPath,
                  componentAttrStore,
                  renderers: userSlinkityConfig.renderers,
                  ...options,
                }),
              )
              res.end()
            } else {
              res.write('')
              res.end()
            }
          },
        ],
      })

      eleventyConfig.on('beforeBuild', () => {
        componentAttrStore.clear()
      })

      eleventyConfig.addTransform(
        'update-url-to-vite-transform-map',
        function (content, outputPath) {
          if (!isSupportedOutputPath(outputPath)) return content

          const relativePath = relative(dir.output, outputPath)
          const formattedAsUrl = toSlashesTrimmed(
            normalizePath(relativePath)
              .replace(/.html$/, '')
              .replace(/index$/, ''),
          )
          urlToViteTransformMap[formattedAsUrl] = {
            outputPath,
            content,
          }
          return content
        },
      )
    }

    if (environment === 'production') {
      eleventyConfig.addTransform('apply-vite', async function (content, outputPath) {
        return await applyViteHtmlTransform({
          content,
          outputPath,
          componentAttrStore,
          renderers: userSlinkityConfig.renderers,
          ...options,
        })
      })
    }
    return {}
  }
}
