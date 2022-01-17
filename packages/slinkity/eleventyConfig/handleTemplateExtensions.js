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
 * @typedef {import('../index').UserSlinkityConfig} UserSlinkityConfig
 *
 * @param {UserSlinkityConfig['eleventyIgnores']} userEleventyIgnores
 * @param {import('./index').Dir} dir
 * @param {ExtensionMeta[]} extensions File extensions to map to ignore statements
 * @returns {string[]} absolute paths and/or globs for eleventy to ignore
 */
module.exports.toEleventyIgnored = function (userEleventyIgnores, dir, extensions) {
  const ignoredPaths = extensions
    .filter((entry) => entry.isIgnoredFromIncludes)
    .map((entry) => path.join(dir.input, dir.includes, `**/*.${entry.extension}`))
  return typeof userEleventyIgnores === 'function'
    ? userEleventyIgnores(ignoredPaths)
    : userEleventyIgnores ?? ignoredPaths
}
