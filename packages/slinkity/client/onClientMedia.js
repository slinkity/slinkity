/** @type {(params: import('../@types').ComponentLoaderClientParams) => void} */
export default async function loader({
  target,
  args,
  renderer,
  component: { mod, props, children },
}) {
  const mql = window.matchMedia(args)

  async function onMediaMatch() {
    const [Component, rendererCb] = await Promise.all([mod(), renderer()])
    rendererCb({
      target,
      props,
      children,
      Component: Component,
    })
  }

  if (mql.matches) {
    await onMediaMatch()
  } else {
    mql.addEventListener('change', onMediaMatch, { once: true })
  }
}
