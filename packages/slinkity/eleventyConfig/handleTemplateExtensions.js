const path = require('path')

/**
 * @typedef ExtensionMeta
 * @property {string} extension
 * @property {boolean} isTemplateFormat
 * @property {boolean} isIgnoredFromIncludes
 */

/** @type {ExtensionMeta[]} */
module.exports.defaultExtensions = [
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

/**
 * @typedef {import('../@types').UserSlinkityConfig} UserSlinkityConfig
 *
 * @param {UserSlinkityConfig['eleventyIgnores']} userEleventyIgnores
 * @param {string} includesDir
 * @param {ExtensionMeta[]} extensions File extensions to map to ignore statements
 * @returns {string[]} absolute paths and/or globs for eleventy to ignore
 */
module.exports.toEleventyIgnored = function (userEleventyIgnores, includesDir, extensions) {
  const relativeIncludesDir = path.relative(process.cwd(), includesDir)
  const ignoredPaths = extensions
    .filter((entry) => entry.isIgnoredFromIncludes)
    .map((entry) => path.join(relativeIncludesDir, `**/*.${entry.extension}`))
  return typeof userEleventyIgnores === 'function'
    ? userEleventyIgnores(ignoredPaths)
    : userEleventyIgnores ?? ignoredPaths
}
