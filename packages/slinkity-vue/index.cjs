const pkg = require('./package.json')
const ssr = require('./ssr.cjs')
const { default: viteVue } = require('@vitejs/plugin-vue')

module.exports = function slinkityVue() {
  return {
    name: 'vue',
    extensions: ['vue'],
    clientEntrypoint: `${pkg.name}/client`,
    ssr,
    viteConfig: {
      plugins: [viteVue()],
      optimizeDeps: {
        include: ['vue'],
      },
      ssr: {
        external: ['@vue/server-renderer'],
      },
    },
    page({ Component }) {
      return {
        getData() {
          return Component.default.frontmatter ?? Component.default.frontMatter ?? {}
        },
        getIslandMeta() {
          return Component.default.island
        },
      }
    },
  }
}
