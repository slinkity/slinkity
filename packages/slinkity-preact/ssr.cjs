const { h } = require('preact');
const renderToString = require('preact-render-to-string');
const pkg = require('./package.json');

module.exports = async function ssr({ Component, props, ssrLoadModule, javascriptFunctions }) {
  const { FunctionsContext } = await ssrLoadModule(`${pkg.name}/server`);
  const vnode = h(FunctionsContext.Provider, { value: javascriptFunctions }, h(Component.default, props));
  return {
    html: renderToString(vnode),
    css: undefined,
  };
};
