import { SLINKITY_REACT_MOUNT_POINT, SLINKITY_ATTRS } from '../../../utils/consts'

const options = {
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
}

function toMountPoint({ componentPath = '', instance = '' }) {
  return document.querySelector(
    `${SLINKITY_REACT_MOUNT_POINT}[${SLINKITY_ATTRS.path}="${componentPath}"][${SLINKITY_ATTRS.instance}="${instance}"]`,
  )
}

export default function lazyLoader({
  componentImporter = () => () => null,
  componentPath = '',
  instance = '',
  props = {},
}) {
  const observer = new IntersectionObserver(async function (entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        const mountPoint = toMountPoint({ componentPath, instance })
        if (!mountPoint.getAttribute('data-s-is-mounted')) {
          const { default: renderComponent } = await import('./_renderer')
          const { default: Component } = await componentImporter()
          renderComponent({
            Component,
            componentPath,
            instance,
            props,
          })
          mountPoint.setAttribute('data-s-is-mounted', true)
        }
      }
    }
  }, options)
  observer.observe(toMountPoint({ componentPath, instance }))
}
