const pkg = require('./package.json')
const vue = require('@vitejs/plugin-vue')

const client = `${pkg.name}/client`
const server = `${pkg.name}/server`

/** @type {import('../slinkity').Renderer} */
module.exports = {
  name: 'vue',
  extensions: ['vue'],
  client,
  server,
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
