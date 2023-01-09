---
title: Partial hydration
---

Slinkity lets you control _if_ and _when_ your components use client-side JavaScript. Let's understand the options available.

## Add a `client:` directive

Slinkity does not render your component client-side by default. In other words, your component will be rendered server-side, but your React `useState`, Vue `ref`s, and Svelte stores will not work until you opt-in to JS. This keeps your client-side bundle as lean as possible.

You'll need to pass a `client:` directive to opt-in to hydration.

### Hydrate component shortcodes

{% include 'examples/hydrate-component-shortcodes.md' %}

[More on component shortcodes →](/docs/component-shortcodes)

### Hydrate component pages

{% include 'examples/hydrate-component-page.md' %}

[More on component pages →](/docs/component-pages-and-layouts)

## Choose the right `client:` directive

Hydration isn't just an on-off switch. Using [Astro's hydration modes](https://docs.astro.build/en/core-concepts/component-hydration/) as a guide, we've added more granular options to choose when your component's JS is loaded. All of these options are available for shortcodes and component pages.

### `client:load`

This mirrors how "traditional" component-based frameworks operate. Components using any of these values will be rendered client-side as soon as possible.

{% include 'examples/hydrate-component-shortcodes.md' %}

Whenever you visit `/page-with-shortcode`, we'll import the component library (Vue in this case) and hydrate `Component.vue` as soon as the page is done parsing (see [MDN's docs on scripts with `type="module"`](https://v8.dev/features/modules#browser)). This ensures you component is interactive as soon as possible.

### `client:visible`

Similar to [lazy-loading images](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading), `client:visible` will only hydrate your component when it is scrolled into view. This uses the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to figure out whether your component is on the page. Once it is, Slinkity will import the necessary dependencies to hydrate your component.

> Note: We **still import Slinkity-specific scripts** ahead of time using [module preloading](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/modulepreload). This is the bare minimum JS to hydrate your component using the Intersection Observer API.

```liquid{% raw %}
<!--server-render with hydration-->
{% island 'Component.vue', 'client:visible' %}{% endisland %}

<!--client-side rendering only-->
{% clientOnlyIsland 'Component.vue', 'client:visible' %}{% endclientOnlyIsland %}
{% endraw %}
```

### `client:idle`

`client:idle` will load your component client-side as soon as the browser's main thread is free. This de-prioritizes your component and allows other JS resources on your page to take precedence.

This relies on [the `window.requestIdleCallback()` method](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) in supported browsers, and sets an arbitrary `200ms` timeout for unsupported browsers.

```liquid{% raw %}
<!--server-render with hydration-->
{% island 'Component.vue', 'client:idle' %}{% endisland %}

<!--client-side rendering only-->
{% clientOnlyIsland 'Component.vue', 'client:idle' %}{% endclientOnlyIsland %}
{% endraw %}
```

### `client:media`

`client:media` loads your component client-side when a media query is met. This is helpful for components that only need interactivity at certain screen sizes (ex. a slide-out navigation for mobile devices). This relies on [the `window.matchMedia()` method](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia).

```liquid{% raw %}
<!--server-render with hydration-->
{% island 'Component.vue', 'client:media="screen (max-width: 400px)"' %}{% endisland %}

<!--client-side rendering only-->
{% clientOnlyIsland 'Component.vue', 'client:media="screen (max-width: 400px)"' %}{% endclientOnlyIsland %}
{% endraw %}
```

> Don't forget wrapper quotes "..." around your media query!

## Pass multiple `client` directives

You may want to hydrate your component once multiple `client:` directives are met. To do so, pass multiple `client:` directives to the `island` shortcode.

This example will only hydrate at screen sizes below `400px` _and_ when the component is visible on-screen:

```liquid{% raw %}
<!--server-render with hydration-->
{% island 'Component.vue', 'client:visible', 'client:media="screen (max-width: 400px)"' %}{% endisland %}

<!--client-side rendering only-->
{% clientOnlyIsland 'Component.vue', 'client:visible', 'client:media="screen (max-width: 400px)"' %}{% endclientOnlyIsland %}
{% endraw %}
```