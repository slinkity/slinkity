const esbuild = require('esbuild')
const path = require('path')

// Avoid bundling node_modules
// Source: https://github.com/evanw/esbuild/issues/619#issuecomment-751995294
const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    const filter = /^[^./]|^\.[^./]|^\.\.[^/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, (args) => ({ path: args.path, external: true }))
  },
}

const entryPoints = ['cli/index.js']
const isWatchEnabled = process.argv.includes('--watch')
let watch = false
if (isWatchEnabled) {
  watch = {
    onRebuild(error) {
      const date = new Date()
      const time = date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
      if (error) console.error(`❌ [${time}] Failed to rebuild`, error)
      else console.log(`🔁 [${time}] Rebuilt ${entryPoints}`)
    },
  }
}

;(async () => {
  await esbuild.build({
    entryPoints,
    bundle: true,
    plugins: [makeAllPackagesExternalPlugin],
    platform: 'node',
    target: 'node14',
    outfile: path.resolve(__dirname, 'lib/cli/index.js'),
    watch,
  })
  console.log(`✅ Built ${entryPoints}`)
})()
