import { toMountPointById } from './toMountPointById'

export default function eagerLoader({ id, Component, props, renderer }) {
  const target = toMountPointById(id)
  renderer({ Component, target, props })
}
