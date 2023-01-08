const pkg = require('./package.json')

module.exports = async function ssr({ Component, props, ssrLoadModule, javascriptFunctions }) {
  const { html, css } = Component.default.render(props, {
    $$slots: {},
  });
  return { html, css: css.code }
}
