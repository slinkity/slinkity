import { SLINKITY_REACT_MOUNT_POINT, SLINKITY_ATTRS } from '../../../utils/consts'

const options = {
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
}

function getMountPointById(id) {
  return document.querySelector(`${SLINKITY_REACT_MOUNT_POINT}[${SLINKITY_ATTRS.id}="${id}"]`)
}

export default function lazyLoader({ id, componentImporter = () => () => null, props = {} }) {
  const observer = new IntersectionObserver(async function (entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const mountPoint = getMountPointById(id)
        if (!mountPoint.getAttribute('data-s-is-hydrated')) {
          const { default: renderComponent } = await import('./_renderer')
          const { default: Component } = await componentImporter()
          renderComponent({ id, Component, props })
          mountPoint.setAttribute('data-s-is-hydrated', true)
        }
      }
    }
  }, options)
  observer.observe(getMountPointById(id))
}
