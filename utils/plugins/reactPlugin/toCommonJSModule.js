const requireFromString = require('require-from-string')
const { build } = require('esbuild')

const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    let filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, (args) => ({ path: args.path, external: true }))
  },
}

const toCommonJSModule = async (inputPath = '') => {
  const { outputFiles } = await build({
    entryPoints: [inputPath],
    format: 'cjs',
    bundle: true,
    plugins: [makeAllPackagesExternalPlugin],
    write: false,
  })
  const { text } = outputFiles[0]
  return requireFromString(text, inputPath)
}

module.exports = {
  toCommonJSModule,
}
