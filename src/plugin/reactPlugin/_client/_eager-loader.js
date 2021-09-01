import renderComponent from './_renderer'

export default function eagerLoader({
  Component = () => null,
  componentPath = '',
  instance = '',
  props = {},
}) {
  renderComponent({
    Component,
    componentPath,
    instance,
    props,
  })
}
