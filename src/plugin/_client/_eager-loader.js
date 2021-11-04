import { toMountPointById } from './_to-mount-point-by-id'

export default async function eagerLoader({ id, loadedModule, props, renderer }) {
  const mountPoint = toMountPointById(id)
  renderer({
    loadedModule,
    mountPoint,
    props,
  })
}
