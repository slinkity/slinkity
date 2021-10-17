import renderComponent from './_renderer'
import { toMountPointById } from './toMountPointById'

export default function eagerLoader({ id, index, Component = () => null, props = {} }) {
  const mountPoint = toMountPointById(id, index)
  renderComponent({
    Component,
    mountPoint,
    props,
  })
}
