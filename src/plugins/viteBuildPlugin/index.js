const { join } = require('path')
const { loadConfiguration, createConfiguration, build } = require('snowpack')
const { promisify } = require('util')
const glob = promisify(require('glob'))
const { CACHE_DIRECTORY } = require('../../utils/consts')

module.exports = function viteBuildPlugin(eleventyConfig, { dir }) {
  eleventyConfig.on('afterBuild', async () => {
    const userConfig = await loadConfiguration()
    const config = createConfiguration({
      root: join(process.cwd(), CACHE_DIRECTORY),
      buildOptions: {
        out: '../_site',
        clean: false,
        // ...userConfig.buildOptions,
      },
      optimize: {
        bundle: true,
        minify: true,
        target: 'es2018',
      },
      // ...userConfig,
    })

    console.log({ config })
    await build({ config })

    // const input = await glob(`${dir.output}/**/*.html`, { absolute: true })
    // if (input.length) {
    //   await build({
    //     root: join(process.cwd(), dir.output),
    //     build: {
    //       outDir: '',
    //       emptyOutDir: true,
    //       rollupOptions: {
    //         input,
    //       },
    //     },
    //   })
    // }
  })
}
