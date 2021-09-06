const crypto = require('crypto')
const requireFromString = require('require-from-string')
const { build } = require('esbuild')
const cssModulesPlugin = require('esbuild-css-modules-plugin')
const { log } = require('../../utils/logger')

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^./]|^\.[^./]|^\.\.[^/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, (args) => ({ path: args.path, external: true }))
  },
}

/**
 * Retrieve a given ES module as a CommonJS module
 * @param {{
 *   inputPath: string,
 *   shouldHaveDefaultExport?: boolean,
 * }} params
 * @returns {Object.<string, any> & {
 *   __stylesGenerated: Object.<string, string>
 * }}
 */
module.exports = async function toCommonJSModule({ inputPath, shouldHaveDefaultExport = true }) {
  const __stylesGenerated = {}
  const { outputFiles } = await build({
    entryPoints: [inputPath],
    outfile: 'ignore',
    format: 'cjs',
    bundle: true,
    plugins: [
      makeAllPackagesExternalPlugin,
      cssModulesPlugin({
        inject: (content) => {
          const key = crypto.createHash('md5').update(content).digest('hex')
          __stylesGenerated[key] = content
          return ''
        },
      }),
    ],
    write: false,
  })
  const { text } = outputFiles[0]
  const result = requireFromString(text, inputPath)
  if (shouldHaveDefaultExport && result.default == null) {
    log({
      type: 'error',
      message: `Looks like you forgot to export default from "${inputPath}"`,
    })
  }
  return { ...result, __stylesGenerated }
}
