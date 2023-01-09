const slinkity = require('slinkity');
const preact = require('@slinkity/preact');
const vue = require('@slinkity/vue');
const svelte = require('@slinkity/svelte');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [preact(), svelte(), vue()],
    }),
  );

  return {
    dir: {
      input: 'src',
    },
  };
};
