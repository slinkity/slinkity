module.exports = {
  presets: [['@babel/preset-env', { targets: { node: '10' } }], '@babel/preset-react'],

  // don't process files starting with underscores
  exclude: [/\/_[^\/]*$/],
}
