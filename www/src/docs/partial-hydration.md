---
title: Partial hydration
---

Slinkity lets you control _if_ and _when_ your JS-laden components are hydrated. Let's understand the options available.

## Set the "hydrate" prop

We do _not_ hydrate your component by default. In other words, your React `useState`, Vue `ref`s, and Svelte stores will not work until you opt-in to JS. This lets you use components for templating guilt free, with the option to hydrate when the need arises.

To opt-in to hydration, you'll need to pass the `hydrate` prop. We'll use "eager" as an example here. [Jump to the next section](#choose-the-right-hydration-mode) for a full list of hydration modes.

### Hydrate component shortcodes

{% include 'examples/hydrate-component-shortcodes.md' %}

[More on component shortcodes →](/docs/component-shortcodes)

### Hydrate component pages

{% include 'examples/hydrate-component-page.md' %}

[More on component pages →](/docs/component-pages-and-layouts)

## Choose the right hydration mode

Hydration isn't just an on-off switch. Using [Astro's hydration modes](https://docs.astro.build/en/core-concepts/component-hydration/) as a guide, we've added a few options to choose when your component's JS is loaded. Expect this list to grow in the future!

### "eager"

This mirrors how "traditional" component-based frameworks operate. An eagerly loaded component will be rendered to static HTML, _and_ shipped to the client as a JavaScript bundle.

Say we have an eagerly loaded React component like this:

```html
<!-- page-with-shortcode.njk -->
<body>
  {% raw %}{% component 'Example.jsx', hydrate='eager' %}{% endraw %}
</body>
```

Whenever you visit `/page-with-shortcode`, we'll import the component library (React in this case) and your `Example.jsx`'s JS bundle as soon as the page is done parsing (see [MDN's docs on scripts with `type="module"`](https://v8.dev/features/modules#browser)). This ensures you component is interactive as soon as possible.

### "lazy"

This is very similar to eager, but with a twist: we **only load your component's JS when your component is scrolled into view.** This uses the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to figure out whether your component is on the page. Once it is, we quickly grab the necessary dependencies to hydrate your component.

> Note: We **still import Slinkity-specific scripts** ahead of time using [module preloading](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/modulepreload). Don't worry, it's a very small bundle! We just use this to mount your component once it scrolls into view.

### "none" - default

This is the default for component pages and shortcodes. Non-hydrated components are rendered to HTML at build time, **but no JavaScript is shipped to the client.** This means no interactivity, no state management, nothing. Use this option if you want to use component languages like React as a templating language alone.