const intersectionObserverOptions = {
  rootMargin: '0px 0px 0px 0px',
  threshold: 0,
}

/** @type {(params: import('../@types').ComponentLoaderClientParams) => void} */
export default async function loader({ target, renderer, component: { mod, props, children } }) {
  let isHydrated = false
  const observer = new IntersectionObserver(async function (entries) {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        if (!isHydrated) {
          const [Component, rendererCb] = await Promise.all([mod(), renderer()])
          await rendererCb({
            target,
            props,
            children,
            Component: Component,
          })
          isHydrated = true
        }
      }
    }
  }, intersectionObserverOptions)
  observer.observe(target)
}
