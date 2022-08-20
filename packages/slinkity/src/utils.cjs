const path = require('path')
const vite = require('vite')

class SlinkityInternalError extends Error {
  constructor(msg) {
    super(msg)
    this.name = '[Slinkity internal]'
  }
}

/** @param {string} id Either a prop ID or regex to concat */
function toPropComment(id) {
  return `<!--slinkity-prop ${id}-->`
}

/** @param {string} id Either a prop ID or regex to concat */
function toSsrComment(id) {
  return `<!--slinkity-ssr ${id}-->`
}

/** @param {string} unresolvedIslandPath */
/** @param {string} islandsDir */
function toResolvedIslandPath(unresolvedIslandPath, islandsDir) {
  return vite.normalizePath(path.resolve(islandsDir, unresolvedIslandPath))
}

/**
 * @typedef ExtractPropIdsFromHtmlResult
 * @property {string} htmlWithoutPropComments
 * @property {Set<string>} propIds
 *
 * @param {string} html
 * @return {ExtractPropIdsFromHtmlResult}
 */
function extractPropIdsFromHtml(html) {
  const propRegex = new RegExp(toPropComment('(.*)'), 'g')
  const matches = [...html.matchAll(propRegex)]

  return {
    htmlWithoutPropComments: html.replace(propRegex, '').trim(),
    propIds: new Set(
      matches.map(([, id]) => {
        return id
      }),
    ),
  }
}

/**
 * Generate client props path relative to output directory
 * @param {string} outputPath
 * @param {string} outputDir
 * @returns {string}
 */
function toClientPropsPathFromOutputPath(outputPath, outputDir) {
  const relativeOutput = path.relative(outputDir, outputPath)
  return vite.normalizePath(path.join('/_props', relativeOutput.replace(/\.\w+$/, '.mjs')))
}

/**
 * Return file extension for a given path without leading "." (i.e. "jsx")
 * @param {string} islandPath
 * @returns {string}
 */
function toIslandExt(islandPath) {
  return path.extname(islandPath).replace(/^\./, '')
}

function toClientScript({
  islandId,
  islandPath,
  loadConditions,
  clientPropsPath,
  clientRendererPath,
  isClientOnly,
  propIds,
}) {
  return `
  <is-land ${loadConditions.join(' ')}>
    <script type="module/island">
      import Component from ${JSON.stringify(islandPath)};
      import render from ${JSON.stringify('/@id/' + clientRendererPath)};

      const target = document.querySelector('slinkity-root[data-root-id=${JSON.stringify(
        islandId,
      )}]');
      ${
        propIds.size
          ? `
      import propsById from ${JSON.stringify(clientPropsPath)};
      const props = {};
      for (let propId of ${JSON.stringify([...propIds])}) {
        const { name, value } = propsById[propId];
        props[name] = value;
      }
      `
          : `
      const props = {};
      `
      }
      render({ Component, target, props, isClientOnly: ${JSON.stringify(isClientOnly)} });
    </script>
    <slinkity-root data-root-id=${JSON.stringify(islandId)}>
      ${isClientOnly ? '' : toSsrComment(islandId)}
    </slinkity-root>
  </is-land>`
}

/**
 * Regex of hard-coded stylesheet extensions
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

module.exports = {
  toPropComment,
  toSsrComment,
  toResolvedIslandPath,
  toIslandExt,
  extractPropIdsFromHtml,
  toClientPropsPathFromOutputPath,
  toClientScript,
  collectCSS,
  SlinkityInternalError,
}
