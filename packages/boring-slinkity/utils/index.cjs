const path = require('path')
const vite = require('vite')

/** @param {string} id Either a prop ID or regex to concat */
function toPropComment(id) {
  return `<!--slinkity-prop ${id}-->`
}

/** @param {string} id Either a prop ID or regex to concat */
function toSsrComment(id) {
  return `<!--slinkity-ssr ${id}-->`
}

/** @param {string} unresolvedIslandPath */
function toResolvedIslandPath(unresolvedIslandPath) {
  return vite.normalizePath(path.resolve('_islands', unresolvedIslandPath));
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
  const propRegex = new RegExp(toPropComment('(.*)'), 'g');
  const matches = [...html.matchAll(propRegex)];

  return {
    htmlWithoutPropComments: html.replace(propRegex, '').trim(),
    propIds: new Set(matches.map(([_, id]) => {
      return id
    }))
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

module.exports = {
  toPropComment,
  toSsrComment,
  toResolvedIslandPath,
  extractPropIdsFromHtml,
  toClientPropsPathFromOutputPath,
}