const slinkity = require('slinkity');
const slinkityPreact = require('@slinkity/preact');

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(
    slinkity.plugin,
    slinkity.defineConfig({
      renderers: [slinkityPreact()],
    }),
  );

  return {
    dir: {
      input: 'src',
    },
  };
};
