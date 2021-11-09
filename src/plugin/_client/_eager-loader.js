import { toMountPointById } from './_to-mount-point-by-id'

export default async function eagerLoader({ id, Component, props, renderer }) {
  const target = toMountPointById(id)
  renderer({
    Component,
    target,
    props,
  })
}
