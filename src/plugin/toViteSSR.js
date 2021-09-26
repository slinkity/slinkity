const { createServer, build } = require('vite')
const requireFromString = require('require-from-string')
const logger = require('../utils/logger')

/**
 *
 * @param {import('vite').ModuleNode} importedModules - modules to traverse for styles
 * @returns {import('vite').ModuleNode[]} importedStyles
 */
function traverseModulesForStyles(importedModules) {
  let importedStyles = []
  for (const importedModule of importedModules) {
    if (importedModule.file.endsWith('css')) {
      importedStyles = [...importedStyles, importedModule]
    } else {
      importedStyles = [
        ...importedStyles,
        ...traverseModulesForStyles(importedModule.importedModules),
      ]
    }
  }
  return importedStyles
}

/**
 *
 * @param {import('vite').ModuleGraph} viteModuleGraph - import graph to traverse for styles
 * @param {string} filePath - file to traverse
 * @returns {import('vite').ModuleNode[]} importedStyles
 */
function getAllImportedStyles(viteModuleGraph, filePath) {
  const styles = traverseModulesForStyles(
    viteModuleGraph.urlToModuleMap.get(filePath).importedModules,
  )
  return styles
}

/**
 * @typedef ViteSSRParams
 * @property {'dev' | 'prod'} environment - whether we want a dev server or a production build
 * @property {import('./index').PluginOptions['dir']} dir
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
 * @property {(filePath: string) => Promise<FormattedModule>} toCommonJSComponentModule - fn to grab a Node-friendly module output from a given file path
 *
 * @returns {ViteSSR} viteSSR
 */
module.exports = async function toViteSSR({ environment, dir }) {
  /**
   * @type {Record<string, FormattedModule>}
   */
  const probablyInefficientCache = {}

  if (environment === 'dev') {
    const server = await createServer({
      root: dir.output,
      server: {
        middlewareMode: 'ssr',
      },
      clearScreen: false,
    })
    return {
      async toCommonJSComponentModule(filePath) {
        if (probablyInefficientCache[filePath]) return probablyInefficientCache[filePath]
        const viteOutput = await server.ssrLoadModule(filePath)
        const styleModules = getAllImportedStyles(server.moduleGraph, filePath)

        /**
         * @type {FormattedModule}
         */
        const mod = {
          default: () => null,
          getProps: () => ({}),
          frontMatter: {},
          __stylesGenerated: styleModules.map((style) => style.file),
          ...viteOutput,
        }
        console.log({ filePath, mod })
        probablyInefficientCache[filePath] = mod
        return mod
      },
    }
  } else {
    return {
      async toCommonJSComponentModule(filePath) {
        if (probablyInefficientCache[filePath]) return probablyInefficientCache[filePath]

        const { output } = await build({
          root: '_site',
          build: {
            ssr: true,
            write: false,
            rollupOptions: {
              input: filePath,
            },
          },
        })
        if (!output?.length) {
          logger.log({
            type: 'error',
            message: `Module ${filePath} didn't have any output. Is this file blank?`,
          })
          return {}
        }
        /**
         * @type {FormattedModule}
         */
        const mod = {
          default: () => null,
          getProps: () => ({}),
          frontMatter: {},
          __stylesGenerated: [],
          ...requireFromString(output[0].code),
        }
        probablyInefficientCache[filePath] = mod
        return mod
      },
    }
  }
}
