module.exports = {
  presets: [
    ['@babel/preset-env', { targets: { node: '10' } }],
    '@babel/preset-react',
    '@babel/preset-typescript',
  ],

  // don't process files starting with underscores
  exclude: [/\/_[^\/]*$/],
  ignore: ['src/renderers'],
}
