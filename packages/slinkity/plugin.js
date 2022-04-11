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

/**
 * @param {any} eleventyConfig
 * @param {import('./@types').UserSlinkityConfig} userSlinkityConfig
 */
module.exports.plugin = function plugin(eleventyConfig, userSlinkityConfig) {
  /** @type {import('./@types').Environment} */
  const environment = process.argv
    .slice(2)
    .find((arg) => arg.startsWith('--serve') || arg.startsWith('--watch'))
    ? 'development'
    : 'production'

  /** @type {{ dir: import('./@types').Dir }} */
  const dir = applyDefaultDirs(eleventyConfig.dir)
  const importAliases = getResolvedImportAliases(dir)
  const viteSSR = toViteSSR({
    dir,
    environment,
    userSlinkityConfig,
  })

  /** @type {import('./eleventyConfig/handleTemplateExtensions').ExtensionMeta[]} */
  const ignoredFromRenderers = userSlinkityConfig.renderers.flatMap((renderer) =>
    renderer.extensions.map((extension) => ({
      extension,
      isTemplateFormat: typeof renderer.page === 'function',
      isIgnoredFromIncludes: true,
    })),
  )
  const extensionMeta = [...defaultExtensions, ...ignoredFromRenderers]
  const componentAttrStore = toComponentAttrStore()

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
    const urlToViteTransformMap = {}
    /** @type {import('vite').ViteDevServer} */
    let viteMiddlewareServer = null

    eleventyConfig.on('beforeBuild', async () => {
      componentAttrStore.clear()
      await viteSSR.createServer()
    })

    if (typeof eleventyConfig.setServerOptions === 'function') {
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
            return viteMiddlewareServer.middlewares(req, res, next)
          },
          async function viteTransformMiddleware(req, res, next) {
            const page = urlToViteTransformMap[toSlashesTrimmed(req.url)]
            if (page) {
              console.log({ url: req.url })
              const { content, outputPath } = page
              res.setHeader('Content-Type', 'text/html')
              res.write(
                await applyViteHtmlTransform({
                  content,
                  outputPath,
                  componentAttrStore,
                  renderers: userSlinkityConfig.renderers,
                  dir,
                  viteSSR,
                  environment,
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
      // TODO: remove once 11ty 2.0 is stable
      eleventyConfig.on('afterBuild', async function () {
        if (!viteMiddlewareServer) {
          viteMiddlewareServer = viteSSR.getServer()
          // restart server to avoid "page reload" logs
          // across all 11ty built routes
          await viteMiddlewareServer.restart()
        }
      })

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
            const page = urlToViteTransformMap[toSlashesTrimmed(req.url)]
            if (page) {
              const { content, outputPath } = page
              res.setHeader('Content-Type', 'text/html')
              res.write(
                await applyViteHtmlTransform({
                  content,
                  outputPath,
                  componentAttrStore,
                  renderers: userSlinkityConfig.renderers,
                  dir,
                  viteSSR,
                  environment,
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

    eleventyConfig.on('eleventy.serverlessUrlMap', (templateMap) => {
      let outputMap = {}

      for (let entry of templateMap) {
        for (let key in entry.serverless) {
          let urls = entry.serverless[key]
          if (!Array.isArray(urls)) {
            urls = [entry.serverless[key]]
          }
          for (let eligibleUrl of urls) {
            // ignore duplicates that have the same input file, via Pagination.
            if (outputMap[eligibleUrl] === entry.inputPath) {
              continue
            }

            // duplicates that don’t use the same input file, throw an error.
            if (outputMap[eligibleUrl]) {
              throw new Error(
                `Serverless URL conflict: multiple input files are using the same URL path (in \`permalink\`): ${outputMap[eligibleUrl]} and ${entry.inputPath}`,
              )
            }

            outputMap[eligibleUrl] = entry.inputPath
          }
        }
      }

      // TODO: set up reverse map to fill "content" on HTML transform
      for (const [inputPath, outputPath] of Object.entries(outputMap)) {
        urlToViteTransformMap[outputPath] = {
          outputPath,
          content: null,
          inputPath,
        }
      }
    })

    eleventyConfig.addTransform('update-url-to-vite-transform-map', function (content, outputPath) {
      console.log({ content, outputPath, hm: this })
      if (!isSupportedOutputPath(outputPath)) return content

      const relativePath = path.relative(dir.output, outputPath)
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
    })
  }

  if (environment === 'production') {
    eleventyConfig.addTransform('apply-vite', async function (content, outputPath) {
      return await applyViteHtmlTransform({
        content,
        outputPath,
        componentAttrStore,
        renderers: userSlinkityConfig.renderers,
        dir,
        viteSSR,
        environment,
      })
    })
    eleventyConfig.on('afterBuild', async function viteProductionBuild() {
      await productionBuild({ userSlinkityConfig, eleventyConfigDir: dir })
    })
  }
}
