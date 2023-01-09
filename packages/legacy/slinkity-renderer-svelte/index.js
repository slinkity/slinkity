const pkg = require('./package.json')
const { svelte } = require('@sveltejs/vite-plugin-svelte')
const preprocess = require('svelte-preprocess')

const client = `${pkg.name}/client`
const server = `${pkg.name}/server`

/** @type {import('../slinkity').Renderer} */
module.exports = {
  name: 'svelte',
  extensions: ['svelte'],
  client,
  server,
  // injected styles will throw for non-hydrated components in production builds
  // TODO: enable when we find a fix
  injectImportedStyles: false,
  viteConfig() {
    return {
      optimizeDeps: {
        include: [client, 'svelte', 'svelte/internal'],
        exclude: [server],
      },
      plugins: [
        svelte({
          preprocess: preprocess(),
          compilerOptions: {
            hydratable: true,
          },
        }),
      ],
    }
  },
  page({ toCommonJSModule }) {
    return {
      useFormatted11tyData: true,
      async getData(inputPath) {
        const { frontMatter } = await toCommonJSModule(inputPath)
        return frontMatter
      },
    }
  },
}
