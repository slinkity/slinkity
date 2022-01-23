import SvelteWrapper from './Wrapper.svelte.ssr.js'

export default async function server({ toCommonJSModule, componentPath, props, children }) {
  const { default: Component } = await toCommonJSModule(componentPath)

  const { html } = SvelteWrapper.render({
    __slinkity_component: Component,
    __slinkity_children: children,
    ...props,
  })
  return { html }
}
