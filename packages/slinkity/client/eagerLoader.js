import renderComponent from './renderer'
import { toMountPointById } from './toMountPointById'

export default function eagerLoader({ id, Component = () => null, props = {} }) {
  const mountPoint = toMountPointById(id)
  renderComponent({
    Component,
    mountPoint,
    props,
  })
}
