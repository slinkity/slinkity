/**
 * @typedef SlinkityConfigOptions
 * @property {{
 *  input: string;
 *  output: string;
 *  includes: string;
 *  layouts: string;
 * }} dir - paths to all significant directories, as specified in 11ty's "dir" documentation
 * @property {import('../cli/toViteSSR').ViteSSR | null} viteSSR - utility to import components as Node-friendly modules
 * @property {import('../main/defineConfig').UserSlinkityConfig} userSlinkityConfig - Slinkity config options (either from user config or defaults)
 * @property {import('browser-sync').Options} browserSyncOptions - Slinkity's own browser sync server for dev environments
 * @property {'dev' | 'prod'} environment - whether we want a dev server or a production build
 */

const browserSync = require('browser-sync')
const { normalizePath } = require('vite')
const { relative, join } = require('path')
const reactPlugin = require('./reactPlugin')
const toSlashesTrimmed = require('../utils/toSlashesTrimmed')
const { getResolvedAliases } = require('../cli/vite')
const { toComponentAttrStore } = require('./componentAttrStore')
const { toHydrationLoadersApplied } = require('./reactPlugin/2-pageTransform')
const { applyViteHtmlTransform } = require('./applyViteHtmlTransform')

// TODO: abstract based on renderer plugins configured
// https://github.com/slinkity/slinkity/issues/55
const extensions = [
  {
    extension: 'jsx',
    isTemplateFormat: true,
    isIgnoredFromIncludes: true,
  },
  {
    extension: 'css',
    isTemplateFormat: false,
    isIgnoredFromIncludes: true,
  },
  {
    extension: 'scss',
    isTemplateFormat: false,
    isIgnoredFromIncludes: true,
  },
]

function toEleventyIgnored(userEleventyIgnores, dir) {
  const defaultIgnoredExts = extensions
    .filter((entry) => entry.isIgnoredFromIncludes)
    .map((entry) => join(dir.input, dir.includes, `**/*.${entry.extension}`))
  return typeof userEleventyIgnores === 'function'
    ? userEleventyIgnores(defaultIgnoredExts)
    : userEleventyIgnores ?? defaultIgnoredExts
}

/**
 * @param {SlinkityConfigOptions} options - all Slinkity plugin options
 * @returns (eleventyConfig: Object) => Object - config we'll apply to the Eleventy object
 */
module.exports = function slinkityConfig({ userSlinkityConfig, ...options }) {
  const { dir, viteSSR, browserSyncOptions, environment } = options
  const eleventyIgnored = toEleventyIgnored(userSlinkityConfig.eleventyIgnores, dir)
  const componentAttrStore = toComponentAttrStore()

  return function (eleventyConfig) {
    eleventyConfig.addTemplateFormats(
      extensions.filter((ext) => ext.isTemplateFormat).map((ext) => ext.extension),
    )
    for (const ignored of eleventyIgnored) {
      eleventyConfig.ignores.add(ignored)
    }

    eleventyConfig.addPlugin(reactPlugin, {
      viteSSR,
      componentAttrStore,
      resolvedImportAliases: getResolvedAliases(dir),
    })

    eleventyConfig.addTransform(
      'apply-react-hydration-loaders',
      async function (content, outputPath) {
        if (!outputPath || !outputPath.endsWith('.html')) return content

        const componentAttrs = componentAttrStore
          .getAllByPage(outputPath)
          // only get components that need hydration loaders
          .filter(({ hydrate }) => hydrate !== 'static')

        return await toHydrationLoadersApplied({
          content,
          componentAttrs,
          dir,
        })
      },
    )

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
                    await applyViteHtmlTransform(
                      { content, outputPath, componentAttrStore },
                      options,
                    ),
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
        return await applyViteHtmlTransform({ content, outputPath, componentAttrStore }, options)
      })
    }
    return {}
  }
}
