const { createServer, build, defineConfig } = require('vite')
const requireFromString = require('require-from-string')
const logger = require('../utils/logger')
const { getSharedConfig } = require('./vite')

/**
 * Regex of hard-coded stylesheet extensions
 * TODO: generate regex from applied Vite plugins
 * @param {string} imp Import to test
 * @returns Whether this import ends with an expected CSS file extension
 */
function isStyleImport(imp) {
  return /\.(css|scss|sass|less|stylus)($|\?*)/.test(imp)
}

module.exports.isStyleImport = isStyleImport

/**
 * Recursively walks through all nested imports for a given module,
 * Searching for any CSS imported via ESM
 * @param {import('vite').ModuleNode | undefined} mod The module node to collect CSS from
 * @param {Set<string>} collectedCSSModUrls All CSS imports found
 * @param {Set<string>} visitedModUrls All modules recursively crawled
 */
function collectCSS(mod, collectedCSSModUrls, visitedModUrls = new Set()) {
  if (!mod || !mod.url || visitedModUrls.has(mod.url)) return

  visitedModUrls.add(mod.url)
  if (isStyleImport(mod.url)) {
    collectedCSSModUrls.add(mod.url)
  } else {
    mod.importedModules.forEach((subMod) => {
      collectCSS(subMod, collectedCSSModUrls, visitedModUrls)
    })
  }
}

module.exports.collectCSS = collectCSS

/**
 * Production-style build using Vite's build CLI
 * @param {ViteSSRParams & {
 *  ssrViteConfig: import('vite').UserConfigExport;
 *  filePath: string;
 * }} params
 * @returns {FormattedModule}
 */
async function viteBuild({ dir, ssrViteConfig, filePath, environment }) {
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
  /** @type {FormattedModule} */
  const defaultMod = {
    default: () => null,
    getProps: () => ({}),
    frontMatter: {},
    __importedStyles: new Set(),
  }
  if (!output?.length) {
    logger.log({
      type: 'error',
      message: `Module ${filePath} didn't have any output. Is this file blank?`,
    })
    return defaultMod
  }
  const __importedStyles = new Set(Object.keys(output[0].modules ?? {}).filter(isStyleImport))
  return {
    ...defaultMod,
    __importedStyles,
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
 * @param {ViteSSRParams}
 *
 * @typedef FormattedModule
 * @property {() => any} default
 * @property {(eleventyData: any) => any} getProps
 * @property {Record<string, any>} frontMatter
 * @property {Set<string>} __importedStyles
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
async function toViteSSR({ environment, dir }) {
  const ssrViteConfig = defineConfig({ root: dir.output })
  /** @type {Record<string, FormattedModule>} */
  const probablyInefficientCache = {}

  if (environment === 'dev') {
    /** @type {import('vite').ViteDevServer} */
    let server = null
    return {
      async toCommonJSModule(filePath, options = { useCache: false }) {
        if (options.useCache && probablyInefficientCache[filePath]) {
          return probablyInefficientCache[filePath]
        }
        /** @type {FormattedModule} */
        let viteOutput
        if (server) {
          const ssrModule = await server.ssrLoadModule(filePath)
          const moduleGraph = await server.moduleGraph.getModuleByUrl(filePath)
          /** @type {Set<string>} */
          const __importedStyles = new Set()
          collectCSS(moduleGraph, __importedStyles)
          viteOutput = {
            default: () => null,
            getProps: () => ({}),
            frontMatter: {},
            __importedStyles,
            ...ssrModule,
          }
        } else {
          viteOutput = await viteBuild({
            dir,
            filePath,
            ssrViteConfig,
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

module.exports.toViteSSR = toViteSSR
