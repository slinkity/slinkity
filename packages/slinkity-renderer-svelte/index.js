const { join } = require('path')
const packageMeta = require('./package.json')
const { svelte } = require('@sveltejs/vite-plugin-svelte')
const autoPreprocess = require('svelte-preprocess')

const client = join(packageMeta.name, 'client')
const server = join(packageMeta.name, 'server')

/** @type {import('../slinkity').Renderer} */
module.exports = {
  name: 'svelte',
  extensions: ['svelte'],
  client,
  server,
  injectImportedStyles: true,
  viteConfig() {
    return {
      optimizeDeps: {
        include: [client, 'svelte', 'svelte/internal'],
        exclude: [server],
      },
      plugins: [
        svelte({
          preprocess: autoPreprocess,
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
