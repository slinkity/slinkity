const pkg = require('./package.json');

module.exports = async function ssr({
  Component,
  props,
  slots,
  ssrLoadModule,
  javascriptFunctions,
}) {
  const { html, css } = Component.default.render(props, {
    $$slots: Object.fromEntries(
      Object.entries(slots).map(([key, value]) => [
        key,
        () => `<slinkity-fragment>${value}</slinkity-fragment>`,
      ]),
    ),
  });
  return { html, css: css.code };
};
