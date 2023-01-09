const React = require('react');
const { renderToString } = require('react-dom/server');
const pkg = require('./package.json');

module.exports = async function ssr({ Component, props, ssrLoadModule, javascriptFunctions }) {
  const FunctionsProvider = await ssrLoadModule(`${pkg.name}/FunctionsProvider`);
  const vnode = React.createElement(
    FunctionsProvider.default,
    { javascriptFunctions },
    React.createElement(Component.default, props),
  );
  return {
    html: renderToString(vnode),
    css: undefined,
  };
};
