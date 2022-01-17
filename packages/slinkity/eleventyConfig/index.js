const browserSync = require('browser-sync')
const { normalizePath } = require('vite')
const { relative } = require('path')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const { getResolvedAliases } = require('../cli/vite')
const { toComponentAttrStore } = require('./componentAttrStore')
const { applyViteHtmlTransform } = require('./applyViteHtmlTransform')
const addComponentPages = require('./addComponentPages')
const addComponentShortcodes = require('./addComponentShortcodes')
const { SLINKITY_HEAD_STYLES } = require('../utils/consts')
const { toEleventyIgnored, defaultExtensions } = require('./handleTemplateExtensions')

/**
 * @typedef {import('./types').EleventyConfigParams} EleventyConfigParams
 */

/**
 * @param {EleventyConfigParams} options - all Slinkity plugin options
 * @returns (eleventyConfig: Object) => Object - config we'll apply to the Eleventy object
 */
module.exports = function toEleventyConfig({ userSlinkityConfig, ...options }) {
  const { dir, viteSSR, browserSyncOptions, environment } = options

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
    for (const renderer of userSlinkityConfig.renderers) {
      addComponentShortcodes({
        renderer,
        eleventyConfig,
        resolvedImportAliases,
        componentAttrStore,
      })
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

    if (environment === 'dev') {
      const urlToOutputHtmlMap = {}

      eleventyConfig.on('beforeBuild', () => {
        componentAttrStore.clear()
      })

      eleventyConfig.on('afterBuild', async () => {
        let server = viteSSR.getServer()
        if (!server) {
          server = await viteSSR.createServer()
          browserSync.create()
          browserSync.init({
            ...browserSyncOptions,
            middleware: [
              async function viteTransformMiddleware(req, res, next) {
                const page = urlToOutputHtmlMap[toSlashesTrimmed(req.originalUrl)]
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
                  next()
                }
              },
              server.middlewares,
            ],
          })
        }
      })

      eleventyConfig.addTransform(
        'update-url-to-compiled-html-map',
        function (content, outputPath) {
          const relativePath = relative(dir.output, outputPath)
          const formattedAsUrl = toSlashesTrimmed(
            normalizePath(relativePath)
              .replace(/.html$/, '')
              .replace(/index$/, ''),
          )
          urlToOutputHtmlMap[formattedAsUrl] = {
            outputPath,
            content,
          }
          return content
        },
      )
    }

    if (environment === 'prod') {
      eleventyConfig.addTransform('apply-vite', async function (content, outputPath) {
        return await applyViteHtmlTransform({
          content,
          outputPath,
          componentAttrStore,
          renderers: userSlinkityConfig.renderers,
          options,
        })
      })
    }
    return {}
  }
}
