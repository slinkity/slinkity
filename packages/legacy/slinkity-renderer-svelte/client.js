import SvelteWrapper from './Wrapper.svelte'

export default function client({ Component, target, props, children, isSSR }) {
  new SvelteWrapper({
    target,
    props: { __slinkity_component: Component, __slinkity_children: children, ...props },
    hydrate: isSSR,
  })
}
