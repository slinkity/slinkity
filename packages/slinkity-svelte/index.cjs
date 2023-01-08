const pkg = require('./package.json')
const ssr = require('./ssr.cjs')
const { svelte } = require('@sveltejs/vite-plugin-svelte')
const preprocess = require('svelte-preprocess')

module.exports = function slinkitySvelte() {
  return {
    name: 'svelte',
    extensions: ['svelte'],
    clientEntrypoint: `${pkg.name}/client`,
    ssr,
    viteConfig: {
      optimizeDeps: {
        include: ['svelte', 'svelte/internal'],
      },
      plugins: [
        svelte({
          preprocess: preprocess(),
          compilerOptions: {
            hydratable: true,
          },
        }),
      ],
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
