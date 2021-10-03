const slinkity = require('../plugin')
const toViteSSR = require('./toViteSSR')

module.exports = async function slinkityConfig({ dir }) {
  const isDev = process.argv.includes('--watch') || process.argv.includes('--serve')

  const viteSSR = await toViteSSR({
    environment: isDev ? 'dev' : 'prod',
    dir,
  })

  return function (eleventyConfig) {
    eleventyConfig.addPlugin(slinkity, { dir, viteSSR })

    return {}
  }
}
