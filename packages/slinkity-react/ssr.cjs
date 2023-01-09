const React = require('react');
const { renderToString } = require('react-dom/server');
const pkg = require('./package.json');

module.exports = async function ssr({ Component, props, ssrLoadModule, javascriptFunctions }) {
  const { FunctionsContext } = await ssrLoadModule(`${pkg.name}/server`);
  const vnode = React.createElement(
    FunctionsContext.Provider,
    { value: javascriptFunctions },
    React.createElement(Component.default, props),
  );
  return {
    html: renderToString(vnode),
    css: undefined,
  };
};
