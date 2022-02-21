import { toMountPointById } from './toMountPointById'

export default function eagerLoader({ id, Component, props, children, renderer }) {
  const target = toMountPointById(id)
  renderer({ Component, target, props, children })
}
