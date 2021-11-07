import SvelteWrapper from './Wrapper.svelte.ssr.js';

export async function renderToStaticMarkup(Component, props, innerHTMLString) {
  const { html, css } = SvelteWrapper.render({ __astro_component: Component.default, __astro_children: innerHTMLString, ...props });
  return { html, css };
}