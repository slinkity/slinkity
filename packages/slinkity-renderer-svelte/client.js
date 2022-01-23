import SvelteWrapper from './Wrapper.svelte'

export default function client({ Component, target, props, children }) {
  new SvelteWrapper({
    target,
    props: { __slinkity_component: Component, __slinkity_children: children, ...props },
    hydrate: true,
  })
}
