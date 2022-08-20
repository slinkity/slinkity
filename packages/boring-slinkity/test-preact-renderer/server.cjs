const preactSsr = require('preact-render-to-string')
const { h } = require('preact')

module.exports.render = function render(IslandModule, props) {
  return preactSsr(h(IslandModule.default, props))
}
