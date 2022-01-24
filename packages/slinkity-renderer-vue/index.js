const { join } = require('path')
const packageMeta = require('./package.json')
const vue = require('@vitejs/plugin-vue')

const client = join(packageMeta.name, 'client')
const server = join(packageMeta.name, 'server')
const toComponentByShortcode = join(packageMeta.name, 'StaticHtml')

/** @type {import('../slinkity').Renderer} */
module.exports = {
  name: 'vue',
  extensions: ['vue'],
  client,
  server,
  toComponentByShortcode,
  injectImportedStyles: true,
  viteConfig() {
    return {
      optimizeDeps: {
        include: [client, 'vue'],
        exclude: [server],
      },
      plugins: [vue()],
      ssr: {
        external: ['@vue/server-renderer'],
      },
    }
  },
  page({ toCommonJSModule }) {
    return {
      useFormatted11tyData: true,
      async getData(inputPath) {
        const { default: Component } = await toCommonJSModule(inputPath)
        return Component.frontMatter
      },
    }
  },
}
