const pkg = require('./package.json');
const ssr = require('./ssr.cjs');
const { svelte } = require('@sveltejs/vite-plugin-svelte');
const preprocess = require('svelte-preprocess');

/**
 * 
 * @param {import('@sveltejs/vite-plugin-svelte').SvelteOptions} pluginOptions
 * @returns 
 */
module.exports = function slinkitySvelte(pluginOptions = {}) {
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
          preprocess: pluginOptions.preprocess ?? preprocess(),
          compilerOptions: {
            hydratable: true,
          },
          ...pluginOptions,
        }),
      ],
    },
    page({ Component }) {
      return {
        getData() {
          return Component.frontmatter ?? Component.frontMatter ?? {};
        },
        getIslandMeta() {
          return Component.island;
        },
      };
    },
  };
};
