const { writeFileRec } = require('../../utils/fileHelpers')
const { join } = require('path')
const { build } = require('vite')
const { promisify } = require('util')
const glob = promisify(require('glob'))

module.exports = function viteBuildPlugin(eleventyConfig, { dir }) {
  eleventyConfig.on('afterBuild', async () => {
    const input = await glob(`${dir.output}/**/*.html`, { absolute: true })
    if (input.length) {
      await build({
        root: join(process.cwd(), dir.output),
        build: {
          outDir: '',
          emptyOutDir: true,
          rollupOptions: {
            input,
          },
        },
      })
    }
  })
}
