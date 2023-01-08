export default function client({ Component, target, props, isClientOnly }) {
  const slots = {};

  new Component({
    target,
    props: {
      ...props,
      $$slots: Object.fromEntries(
        Object.entries(slots).map(([key, value]) => [
          key,
          createSlotDefinition(value),
        ]),
      ),
      $$scope: { ctx: [] },
    },
    hydrate: !isClientOnly,
  })
}

/*
 * Source: https://github.com/withastro/astro/blob/main/packages/integrations/svelte/client.js#L25
 */
function createSlotDefinition(children) {
	return [
		() => ({
			// mount
			m(target) {
				target.insertAdjacentHTML(
					'beforeend',
					children,
				);
			},
			// create
			c: noop,
			// hydrate
			l: noop,
			// destroy
			d: noop,
		}),
		noop,
		noop,
	];
}

const noop = () => {};