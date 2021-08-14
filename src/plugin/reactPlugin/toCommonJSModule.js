const requireFromString = require('require-from-string')
const { build } = require('esbuild')
const { log } = require('../../utils/logger')

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^./]|^\.[^./]|^\.\.[^/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, (args) => ({ path: args.path, external: true }))
  },
}

module.exports = async function toCommonJSModule({
  inputPath = '',
  shouldHaveDefaultExport = true,
}) {
  const { outputFiles } = await build({
    entryPoints: [inputPath],
    // TODO: this helps swallow CSS module errors
    // But this causes CSS module classes to get stripped from the output!
    outfile: 'ignore',
    format: 'cjs',
    bundle: true,
    plugins: [makeAllPackagesExternalPlugin],
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
  return result
}
