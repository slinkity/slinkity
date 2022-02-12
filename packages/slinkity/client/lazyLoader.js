import { toMountPointById } from './toMountPointById'

const options = {
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
}

export default function lazyLoader({ id, props, children, toComponent, toRenderer }) {
  const observer = new IntersectionObserver(async function (entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const target = toMountPointById(id)
        if (!target.getAttribute('data-s-is-hydrated')) {
          const { default: renderer } = await toRenderer()
          const { default: Component } = await toComponent()
          renderer({ Component, target, props, children })
          target.setAttribute('data-s-is-hydrated', true)
        }
      }
    }
  }, options)
  observer.observe(toMountPointById(id))
}
