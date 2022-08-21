const pkg = require('./package.json')
const ssr = require('./ssr.cjs')
const { default: vitePreact } = require('@preact/preset-vite')

module.exports = function slinkityPreact() {
  return {
    name: 'preact',
    extensions: ['jsx', 'tsx'],
    clientEntrypoint: `${pkg.name}/client`,
    ssr,
    viteConfig: {
      plugins: [vitePreact()],
      optimizeDeps: {
        include: ['preact', 'preact/devtools', 'preact/hooks', 'preact/jsx-dev-runtime'],
      },
    },
    page({ Component }) {
      return {
        getData() {
          return Component.frontmatter ?? Component.frontMatter ?? {}
        },
        getIslandMeta() {
          return Component.island
        },
      }
    },
  }
}
