import { toMountPointById } from './_to-mount-point-by-id'

const options = {
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
}

export default function lazyLoader({ id, props, toLoadedModule, toRenderer }) {
  const observer = new IntersectionObserver(async function (entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const mountPoint = toMountPointById(id)
        if (!mountPoint.getAttribute('data-s-is-hydrated')) {
          const { default: renderer } = await toRenderer()
          const { default: loadedModule } = await toLoadedModule()
          renderer({ mountPoint, loadedModule, props })
          mountPoint.setAttribute('data-s-is-hydrated', true)
        }
      }
    }
  }, options)
  observer.observe(toMountPointById(id))
}
