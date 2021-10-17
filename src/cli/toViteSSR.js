const { createServer, build, defineConfig } = require('vite')
const requireFromString = require('require-from-string')
const logger = require('../utils/logger')
const { resolve, join } = require('path')
const { getConfigFile } = require('./vite')
const { IMPORT_ALIASES } = require('../utils/consts')

/**
 * @typedef {import('./reactPlugin/2-pageTransform/componentAttrStore').ComponentAttrs['styleToFilePathMap']} StyleToFilePathMap
 * @returns {{
 *   getCSS: () => StyleToFilePathMap;
 *   plugin: import('vite').PluginOption;
 * }}
 */
function gimmeCSSPlugin() {
  /**
   * @type {StyleToFilePathMap}
   */
  const styleToFilePathMap = {}

  return {
    getCSS() {
      return styleToFilePathMap
    },
    plugin: {
      name: 'gimme-css-plugin',
      transform(code, id) {
        if (/\.(css|scss|sass|less|stylus)$/.test(id)) {
          styleToFilePathMap[id] = code
          return { code: '' }
        }
        return null
      },
    },
  }
}

/**
 * @typedef ViteSSRParams
 * @property {import('../plugin').SlinkityConfigOptions['environment']} environment
 * @property {import('../plugin').SlinkityConfigOptions['dir']} dir
 * @param {ViteSSRParams}
 *
 * @typedef {{
 *  default: () => any;
 *  getProps: (eleventyData: any) => any;
 *  frontMatter: Record<string, any>;
 *  __stylesGenerated: Record<string, string>;
 * }} FormattedModule - expected keys from a given component module
 *
 * @typedef ViteSSR - available fns for module conversion
 * @property {(filePath: string) => Promise<FormattedModule>} toComponentCommonJSModule - fn to grab a Node-friendly module output from a given file path
 * @property {import('vite').ViteDevServer | null} server
 *
 * @returns {ViteSSR} viteSSR
 */
module.exports = async function toViteSSR({ environment, dir }) {
  const generatedStyles = gimmeCSSPlugin()

  /**
   * Resolve filePath relative to the output directory
   * @param {string} filePath - relative path
   * @returns {string}
   */
  function toResolved(filePath) {
    return resolve(dir.output, filePath)
  }

  /**
   * Get Vite config shared by dev and production
   * @returns {import('vite').UserConfigExport}
   */
  async function sharedConfig() {
    return defineConfig({
      root: dir.output,
      plugins: [generatedStyles.plugin],
      clearScreen: false,
      configFile: await getConfigFile(),
      resolve: {
        alias: {
          [IMPORT_ALIASES.root]: join(process.cwd(), '/'),
          [IMPORT_ALIASES.input]: join(process.cwd(), dir.input, '/'),
          [IMPORT_ALIASES.includes]: join(process.cwd(), dir.input, dir.includes, '/'),
          [IMPORT_ALIASES.layouts]: join(process.cwd(), dir.input, dir.layouts, '/'),
        },
      },
    })
  }

  if (environment === 'dev') {
    const server = await createServer({
      ...(await sharedConfig()),
      server: {
        middlewareMode: 'ssr',
      },
    })
    return {
      async toComponentCommonJSModule(filePath) {
        const viteOutput = await server.ssrLoadModule(toResolved(filePath))
        return {
          default: () => null,
          getProps: () => ({}),
          frontMatter: {},
          __stylesGenerated: generatedStyles.getCSS(),
          ...viteOutput,
        }
      },
      server,
    }
  } else {
    /**
     * @type {Record<string, FormattedModule>}
     */
    const probablyInefficientCache = {}
    return {
      async toComponentCommonJSModule(filePath) {
        const resolvedPath = toResolved(filePath)
        if (probablyInefficientCache[resolvedPath]) return probablyInefficientCache[resolvedPath]

        const { output } = await build({
          ...(await sharedConfig()),
          build: {
            ssr: true,
            write: false,
            rollupOptions: {
              input: resolvedPath,
            },
          },
        })
        /**
         * @type {FormattedModule}
         */
        const mod = {
          default: () => null,
          getProps: () => ({}),
          frontMatter: {},
          __stylesGenerated: generatedStyles.getCSS(),
        }
        if (!output?.length) {
          logger.log({
            type: 'error',
            message: `Module ${resolvedPath} didn't have any output. Is this file blank?`,
          })
          return mod
        }
        probablyInefficientCache[resolvedPath] = {
          ...mod,
          // converts our stringified JS to a CommonJS module in memory
          // saves reading / writing to disk!
          // TODO: check performance impact
          ...requireFromString(output[0].code),
        }
        return probablyInefficientCache[resolvedPath]
      },
      server: null,
    }
  }
}
