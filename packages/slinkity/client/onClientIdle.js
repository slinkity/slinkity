/** @type {(params: import('../@types').ComponentLoaderClientParams) => void} */
export default async function loader({ target, renderer, component: { mod, props, children } }) {
  async function onClientIdle() {
    const [Component, rendererCb] = await Promise.all([mod(), renderer()])
    rendererCb({
      target,
      props,
      children,
      Component: Component,
    })
  }

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(onClientIdle)
  } else {
    // for browsers that don't support requestIdleCallback
    // wait 200ms to give main thread some time to free up
    setTimeout(onClientIdle, 200)
  }
}
