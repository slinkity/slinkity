const { createServer, build, defineConfig } = require('vite')
const requireFromString = require('require-from-string')
const logger = require('../utils/logger')
const { getSharedConfig } = require('./vite')

/**
 * @typedef {import('./reactPlugin/2-pageTransform/componentAttrStore').ComponentAttrs['styleToFilePathMap']} StyleToFilePathMap
 * @typedef GimmeCSSPluginReturn
 * @property {() => StyleToFilePathMap} getCSS
 * @property {import('vite').PluginOption}
 * @returns {GimmeCSSPluginReturn}
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
 * Production-style build using Vite's build CLI
 * @param {ViteSSRParams & {
 *  ssrViteConfig: import('vite').UserConfigExport;
 *  filePath: string;
 *  generatedStyles: GimmeCSSPluginReturn;
 * }} params
 * @returns {FormattedModule}
 */
async function viteBuild({ dir, ssrViteConfig, filePath, environment, generatedStyles }) {
  const { output } = await build({
    ...ssrViteConfig,
    ...(await getSharedConfig(dir)),
    mode: environment,
    build: {
      ssr: true,
      write: false,
      rollupOptions: {
        input: filePath,
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
      message: `Module ${filePath} didn't have any output. Is this file blank?`,
    })
    return mod
  }
  return {
    ...mod,
    // converts our stringified JS to a CommonJS module in memory
    // saves reading / writing to disk!
    // TODO: check performance impact
    ...requireFromString(output[0].code),
  }
}

/**
 * @typedef ViteSSRParams
 * @property {import('../plugin').SlinkityConfigOptions['environment']} environment
 * @property {import('../plugin').SlinkityConfigOptions['dir']} dir
 * @property {import('../main/defineConfig').UserSlinkityConfig} userSlinkityConfig
 * @param {ViteSSRParams}
 *
 * @typedef {{
 *  default: () => any;
 *  getProps: (eleventyData: any) => any;
 *  frontMatter: Record<string, any>;
 *  __stylesGenerated: Record<string, string>;
 * }} FormattedModule - expected keys from a given component module
 *
 * @typedef ToCommonJSModuleOptions
 * @property {boolean} useCache Whether to (attempt to) use the in-memory cache for fetching a build result. Defaults to true in production
 *
 * @typedef ViteSSR - available fns for module conversion
 * @property {(filePath: string, options?: ToCommonJSModuleOptions) => Promise<FormattedModule>} toCommonJSModule - fn to grab a Node-friendly module output from a given file path
 * @property {() => (import('vite').ViteDevServer | null)} getServer Get instance of the Vite development server (always null for production envs)
 * @property {() => Promise<void>} createServer Starts the Vite development server (has no effect for production envs)
 *
 * @returns {ViteSSR} viteSSR
 */
module.exports = async function toViteSSR({ environment, dir, userSlinkityConfig }) {
  /**
   * @type {import('vite').Plugin[]}
   */
  const rendererPlugins = userSlinkityConfig.renderers.map((renderer) => ({
    name: `@slinkity/renderer-${renderer.name}`,
    config: renderer.viteConfig ?? {},
  }))

  const generatedStyles = gimmeCSSPlugin()
  const ssrViteConfig = defineConfig({
    root: dir.output,
    plugins: [generatedStyles.plugin, ...rendererPlugins],
  })
  /**
   * @type {Record<string, FormattedModule>}
   */
  const probablyInefficientCache = {}

  if (environment === 'dev') {
    /**
     * @type {import('vite').ViteDevServer}
     */
    let server = null
    return {
      async toCommonJSModule(filePath, options = { useCache: false }) {
        if (options.useCache && probablyInefficientCache[filePath]) {
          return probablyInefficientCache[filePath]
        }
        /**
         * @type {FormattedModule}
         */
        let viteOutput
        if (server) {
          viteOutput = {
            default: () => null,
            getProps: () => ({}),
            frontMatter: {},
            __stylesGenerated: generatedStyles.getCSS(),
            ...(await server.ssrLoadModule(filePath)),
          }
        } else {
          viteOutput = await viteBuild({
            dir,
            filePath,
            ssrViteConfig,
            generatedStyles,
            environment,
          })
        }
        probablyInefficientCache[filePath] = viteOutput
        return viteOutput
      },
      getServer() {
        return server
      },
      async createServer() {
        server = await createServer({
          ...ssrViteConfig,
          ...(await getSharedConfig(dir)),
          server: {
            middlewareMode: 'ssr',
          },
        })
        return server
      },
    }
  } else {
    return {
      async toCommonJSModule(filePath, options = { useCache: true }) {
        if (options.useCache && probablyInefficientCache[filePath]) {
          return probablyInefficientCache[filePath]
        }
        const viteOutput = await viteBuild({
          dir,
          filePath,
          generatedStyles,
          ssrViteConfig,
          environment,
        })
        probablyInefficientCache[filePath] = viteOutput
        return viteOutput
      },
      getServer() {
        return null
      },
      createServer() {},
    }
  }
}
