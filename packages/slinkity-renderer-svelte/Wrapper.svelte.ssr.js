/* Source: https://github.com/withastro/astro/blob/main/packages/renderers/renderer-svelte/Wrapper.svelte.ssr.js */
import { create_ssr_component, missing_component, validate_component } from 'svelte/internal'

const App = create_ssr_component(($$result, $$props) => {
  const { __slinkity_component: Component, __slinkity_children, ...props } = $$props
  const children = {}
  if (__slinkity_children != null) {
    children.default = () => `<slinkity-fragment>${__slinkity_children}</slinkity-fragment>`
  }

  return `${validate_component(Component || missing_component, 'svelte:component').$$render(
    $$result,
    Object.assign(props),
    {},
    children,
  )}`
})

export default App
