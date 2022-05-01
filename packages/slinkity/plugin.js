const { normalizePath } = require('vite')
const { productionBuild } = require('./cli/vite')
const path = require('path')
const toSlashesTrimmed = require('./utils/toSlashesTrimmed')
const { getResolvedImportAliases } = require('./cli/vite')
const { toComponentAttrStore } = require('./eleventyConfig/componentAttrStore')
const {
  applyViteHtmlTransform,
  isSupportedOutputPath,
} = require('./eleventyConfig/applyViteHtmlTransform')
const addComponentPages = require('./eleventyConfig/addComponentPages')
const addComponentShortcodes = require('./eleventyConfig/addComponentShortcodes')
const { SLINKITY_HEAD_STYLES, ELEVENTY_DEFAULT_DIRS } = require('./utils/consts')
const {
  toEleventyIgnored,
  defaultExtensions,
} = require('./eleventyConfig/handleTemplateExtensions')
const { toViteSSR } = require('./cli/toViteSSR')

/**
 * TODO: remove once 11ty 2.0 is baselined
 * required as fallback for 11ty 1.X
 *
 * Apply default values for missing dirs
 * @param {any} dir dir supplied by 11ty config
 * @returns {import('./@types').Dir}
 */
function applyDefaultDirs(dir = {}) {
  return {
    input: dir.input ?? ELEVENTY_DEFAULT_DIRS.input,
    output: dir.output ?? ELEVENTY_DEFAULT_DIRS.output,
    includes: dir.includes ?? ELEVENTY_DEFAULT_DIRS.includes,
    layouts: dir.layouts ?? ELEVENTY_DEFAULT_DIRS.layouts,
  }
}

// initiating store outside of plugin to avoid stale closure problem:
// in serverless, 11ty evaluates the plugin *twice* while attaching
// shortcodes and page extensions *once.* This causes all shortcodes / extensions
// to reference an old store if we init that store inside the plugin
/** @type {import('./eleventyConfig/componentAttrStore').ComponentAttrStore} */
let componentAttrStore = null

// Similar problem with our Vite middleware server.
// Store as a global to use the same middleware across environments
/** @type {import('./@types').ViteSSR} */
let viteSSR = null

/**
 * @param {any} eleventyConfig
 * @param {import('./@types').UserSlinkityConfig} userSlinkityConfig
 */
module.exports.plugin = function plugin(eleventyConfig, userSlinkityConfig) {
  const isEleventyV2 = typeof eleventyConfig.setServerOptions === 'function'

  /** @type {import('./@types').Environment} */
  const environment = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--serve') || arg.startsWith('--watch'))
    ? 'development'
    : 'production'

  /** @type {{ dir: import('./@types').Dir }} */
  const dir = applyDefaultDirs(eleventyConfig.dir)
  const importAliases = getResolvedImportAliases(dir)
  if (!viteSSR) {
    viteSSR = toViteSSR({
      dir,
      environment,
      userSlinkityConfig,
    })
  }

  if (!componentAttrStore) {
    componentAttrStore = toComponentAttrStore({
      lookupType: environment === 'development' ? 'url' : 'outputPath',
    })
  }

  /** @type {import('./eleventyConfig/handleTemplateExtensions').ExtensionMeta[]} */
  const ignoredFromRenderers = userSlinkityConfig.renderers.flatMap((renderer) =>
    renderer.extensions.map((extension) => ({
      extension,
      isTemplateFormat: typeof renderer.page === 'function',
      isIgnoredFromIncludes: true,
    })),
  )
  const extensionMeta = [...defaultExtensions, ...ignoredFromRenderers]

  eleventyConfig.addTemplateFormats(
    extensionMeta.filter((ext) => ext.isTemplateFormat).map((ext) => ext.extension),
  )

  const eleventyIgnored = toEleventyIgnored(
    userSlinkityConfig.eleventyIgnores,
    importAliases.includes,
    extensionMeta,
  )

  for (const ignored of eleventyIgnored) {
    eleventyConfig.ignores.add(ignored)
  }

  eleventyConfig.addGlobalData('__slinkity', {
    head: SLINKITY_HEAD_STYLES,
  })

  addComponentShortcodes({
    renderers: userSlinkityConfig.renderers,
    eleventyConfig,
    componentAttrStore,
    importAliases,
  })
  for (const renderer of userSlinkityConfig.renderers) {
    if (renderer.page) {
      addComponentPages({
        renderer,
        eleventyConfig,
        componentAttrStore,
        importAliases,
        viteSSR,
      })
    }
  }

  if (environment === 'development') {
    /** @type {Record<string, string>} */
    const urlToRenderedContentMap = {}
    /** @type {import('vite').ViteDevServer} */
    let viteMiddlewareServer = null

    eleventyConfig.on('beforeBuild', async () => {
      // TODO: separate static vs serverless stores
      // to avoid clearing problem
      // componentAttrStore.clear()
      if (!viteSSR.getServer()) {
        await viteSSR.createServer()
      }
    })

    /** @type {Record<string, string>} */
    let serverlessInputPathToUrlMap = {}
    eleventyConfig.on('eleventy.serverlessUrlMap', async (templateMap) => {
      for (let entry of templateMap) {
        for (let key in entry.serverless) {
          let urls = entry.serverless[key]
          if (!Array.isArray(urls)) {
            urls = [entry.serverless[key]]
          }
          // We'll assume all urls will contain the same components
          // and take the first url as the source of truth.
          // This is imported during the "componentLookupId" step later
          serverlessInputPathToUrlMap[entry.inputPath] = urls[0]
        }
      }
    })

    eleventyConfig.addTransform('slinkity:handle-serverless-transform', async function (content) {
      const serverlessUrl = serverlessInputPathToUrlMap[this.inputPath]
      if (serverlessUrl) {
        return await applyViteHtmlTransform({
          content,
          componentLookupId: serverlessUrl,
          componentAttrStore,
          renderers: userSlinkityConfig.renderers,
          viteSSR,
        })
      }
      return content
    })

    if (isEleventyV2) {
      eleventyConfig.on('eleventy.after', function ({ results, runMode }) {
        // TODO: remove '--serve' flag check once slinkity CLI is removed
        if (runMode === 'serve' || process.argv.slice(2).find((arg) => arg.startsWith('--serve'))) {
          for (let { content, outputPath, url } of results) {
            // used for serving content within dev server middleware
            if (isSupportedOutputPath(outputPath)) {
              urlToRenderedContentMap[url] = content
            }
          }
        }
      })
      eleventyConfig.setServerOptions({
        async setup() {
          if (!viteMiddlewareServer) {
            viteMiddlewareServer = viteSSR.getServer()
            // restart server to avoid "page reload" logs
            // across all 11ty built routes
            await viteMiddlewareServer.restart()
          }
        },
        domdiff: false,
        middleware: [
          (req, res, next) => {
            // Some Vite server middlewares are missing content types
            // Set to text/plain as a safe default
            res.setHeader('Content-Type', 'text/plain')
            viteMiddlewareServer.middlewares(req, res, next)
          },
          async function viteTransformMiddleware(req, res, next) {
            const content = urlToRenderedContentMap[req.url]
            if (content) {
              res.setHeader('Content-Type', 'text/html')
              res.write(
                await applyViteHtmlTransform({
                  content,
                  componentLookupId: req.url,
                  componentAttrStore,
                  renderers: userSlinkityConfig.renderers,
                  viteSSR,
                }),
              )
              res.end()
            } else {
              next()
            }
          },
        ],
      })
    } else {
      // TODO: remove this entire "else" block once 11ty 2.0 is stable
      eleventyConfig.on('afterBuild', async function () {
        if (!viteMiddlewareServer) {
          viteMiddlewareServer = viteSSR.getServer()
          // restart server to avoid "page reload" logs
          // across all 11ty built routes
          await viteMiddlewareServer.restart()
        }
      })

      // legacy: since we don't know the web URL for a given output path,
      // we need to compute our best guess using normalizePath and replace
      // this is no longer necessary in the v2 code above!
      eleventyConfig.addTransform(
        'update-url-to-rendered-content-map',
        function (content, outputPath) {
          if (!isSupportedOutputPath(outputPath)) return content

          const relativePath = path.relative(dir.output, outputPath)
          const formattedAsUrl = toSlashesTrimmed(
            normalizePath(relativePath)
              .replace(/.html$/, '')
              .replace(/index$/, ''),
          )
          urlToRenderedContentMap[formattedAsUrl] = content
          return content
        },
      )

      eleventyConfig.setBrowserSyncConfig({
        snippet: false,
        middleware: [
          async (req, res, next) => {
            // Some Vite server middlewares are missing content types
            // Set to text/plain as a safe default
            res.setHeader('Content-Type', 'text/plain')
            return viteMiddlewareServer.middlewares(req, res, next)
          },
          async function viteTransformMiddleware(req, res, next) {
            const content = urlToRenderedContentMap[toSlashesTrimmed(req.url)]
            if (content) {
              res.setHeader('Content-Type', 'text/html')
              res.write(
                await applyViteHtmlTransform({
                  content,
                  componentLookupId: req.url,
                  componentAttrStore,
                  renderers: userSlinkityConfig.renderers,
                  viteSSR,
                }),
              )
              res.end()
            } else {
              next()
            }
          },
        ],
      })
    }
  }

  if (environment === 'production') {
    eleventyConfig.addTransform('apply-vite', async function (content, outputPath) {
      return await applyViteHtmlTransform({
        content,
        componentLookupId: outputPath,
        componentAttrStore,
        renderers: userSlinkityConfig.renderers,
        viteSSR,
      })
    })
    eleventyConfig.on('afterBuild', async function viteProductionBuild() {
      await productionBuild({ userSlinkityConfig, eleventyConfigDir: dir })
    })
  }
}
