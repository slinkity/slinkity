import { toMountPointById } from './_to-mount-point-by-id'

const options = {
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
}

export default function lazyLoader({ id, props, toComponent, toRenderer }) {
  const observer = new IntersectionObserver(async function (entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const target = toMountPointById(id)
        if (!target.getAttribute('data-s-is-hydrated')) {
          const { default: renderer } = await toRenderer()
          const Component = await toComponent()
          renderer({ Component, target, props })
          target.setAttribute('data-s-is-hydrated', true)
        }
      }
    }
  }, options)
  observer.observe(toMountPointById(id))
}
