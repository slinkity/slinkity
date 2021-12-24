const esbuild = require('esbuild')

// Avoid bundling node_modules
// Source: https://github.com/evanw/esbuild/issues/619#issuecomment-751995294
const makeAllPackagesExternalPlugin = {
  name: 'make-all-packages-external',
  setup(build) {
    const filter = /^[^.\/]|^\.[^.\/]|^\.\.[^\/]/ // Must not start with "/" or "./" or "../"
    build.onResolve({ filter }, (args) => ({ path: args.path, external: true }))
  },
}

const entryPoints = ['./src/cli/index.js']
const isWatchEnabled = process.argv.includes('--watch')
let watch = false
if (isWatchEnabled) {
  watch = {
    onRebuild(error) {
      if (error) console.error('❌ Failed to rebuild', error)
      else console.log(`🔁 Rebuilt ${entryPoints}`)
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
    outfile: 'lib/cli/index.js',
    watch,
  })
  console.log(`✅ Built ${entryPoints}`)
})()
