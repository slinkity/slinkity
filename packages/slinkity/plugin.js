const { normalizePath } = require('vite')
const { relative } = require('path')
const toSlashesTrimmed = require('./utils/toSlashesTrimmed')
const { getResolvedAliases } = require('./cli/vite')
const { toComponentAttrStore } = require('./eleventyConfig/componentAttrStore')
const { applyViteHtmlTransform } = require('./eleventyConfig/applyViteHtmlTransform')
const addComponentPages = require('./eleventyConfig/addComponentPages')
const addComponentShortcodes = require('./eleventyConfig/addComponentShortcodes')
const { SLINKITY_HEAD_STYLES } = require('./utils/consts')
const {
  toEleventyIgnored,
  defaultExtensions,
} = require('./eleventyConfig/handleTemplateExtensions')
const { toViteSSR } = require('./cli/toViteSSR')

/**
 * @param {any} eleventyConfig
 * @param {import('./@types').UserSlinkityConfig} userSlinkityConfig
 */
module.exports.plugin = function plugin(eleventyConfig, userSlinkityConfig) {
  // TODO: infer from CLI flags
  let environment = 'development'

  /** @type {import('./@types').PluginConfigGlobals} */
  const configGlobals = new Proxy(
    {
      viteSSR: null,
      dir: null,
      resolvedAliases: null,
    },
    {
      get(target, prop) {
        if (target[prop] === null) {
          throw `Tried to access ${prop} before initialization`
        } else {
          return target[prop]
        }
      },
    },
  )

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
    userSlinkityConfig.componentDir,
    extensionMeta,
  )

  for (const ignored of eleventyIgnored) {
    eleventyConfig.ignores.add(ignored)
  }

  eleventyConfig.on('eleventy.directories', async function (eleventyDirs) {
    configGlobals.dir = eleventyDirs
    configGlobals.resolvedAliases = getResolvedAliases(eleventyDirs)
  })

  eleventyConfig.addGlobalData('__slinkity', {
    head: SLINKITY_HEAD_STYLES,
  })

  addComponentShortcodes({
    renderers: userSlinkityConfig.renderers,
    eleventyConfig,
    componentAttrStore,
    configGlobals,
  })
  for (const renderer of userSlinkityConfig.renderers) {
    if (renderer.page) {
      addComponentPages({
        renderer,
        eleventyConfig,
        componentAttrStore,
        configGlobals,
      })
    }
  }

  if (environment === 'development') {
    /** @type {Record<string, string>} */
    const urlToOutputHtmlMap = {}
    /** @type {import('vite').ViteDevServer} */
    let viteMiddlewareServer = null

    eleventyConfig.setServerOptions({
      async setup() {
        if (!viteMiddlewareServer) {
          try {
            configGlobals.viteSSR
          } catch {
            // if we fail to access viteSSR, it wasn't initialized
            configGlobals.viteSSR = await toViteSSR({
              dir: configGlobals.dir,
              environment,
              userSlinkityConfig,
            })
          }
          viteMiddlewareServer = await configGlobals.viteSSR.createServer()
        }
      },
      middleware: [
        (req, res, next) => {
          // Some Vite server middlewares are missing content types
          // Set to text/plain as a safe default
          res.setHeader('Content-Type', 'text/plain')
          return viteMiddlewareServer.middlewares(req, res, next)
        },
        async function viteTransformMiddleware(req, res, next) {
          console.log(req.url)
          const page = urlToOutputHtmlMap[toSlashesTrimmed(req.url)]
          if (page) {
            const { content, outputPath } = page
            res.setHeader('Content-Type', 'text/html')
            res.write(
              await applyViteHtmlTransform({
                content,
                outputPath,
                componentAttrStore,
                renderers: userSlinkityConfig.renderers,
                dir: configGlobals.dir,
                viteSSR: configGlobals.viteSSR,
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

    eleventyConfig.on('beforeBuild', () => {
      componentAttrStore.clear()
    })

    eleventyConfig.addTransform('update-url-to-compiled-html-map', function (content, outputPath) {
      // avoid writing content to urlToOutputHtmlMap that Vite cannot transform
      // ex. permalink: false, permalink: sitemap.xml
      if (typeof outputPath !== 'string' || !outputPath.endsWith('.html')) return content

      const relativePath = relative(configGlobals.dir.output, outputPath)
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
    })
  }

  // if (environment === 'production') {
  //   eleventyConfig.addTransform('apply-vite', async function (content, outputPath) {
  //     return await applyViteHtmlTransform({
  //       content,
  //       outputPath,
  //       componentAttrStore,
  //       renderers: userSlinkityConfig.renderers,
  //       ...options,
  //     })
  //   })
  //   eleventyConfig.on('after-build', async function viteProductionBuild() {
  //     const intermediateDir = relative('.', await mkdtemp('.11ty-build-'))
  //     await viteBuild({
  //       userSlinkityConfig,
  //       eleventyDir: userConfigDir,
  //       input: intermediateDir,
  //       output: outputDir,
  //     })
  //   })
  // }
  return {}
}
