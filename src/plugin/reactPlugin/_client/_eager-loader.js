import renderComponent from './_renderer'

export default function eagerLoader({ id, Component = () => null, props = {} }) {
  renderComponent({
    Component,
    id,
    props,
  })
}
