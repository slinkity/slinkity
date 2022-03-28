---
title: Partial hydration
---

Slinkity lets you control _if_ and _when_ your JS-laden components are hydrated. Let's understand the options available.

## Set the "hydrate" prop

We do _not_ render your component client-side by default. In other words, your component will be rendered server-side, but your React `useState`, Vue `ref`s, and Svelte stores will not work until you opt-in to JS. This lets you use components for templating guilt free, with the option to hydrate when the need arises.

You'll need to pass the `hydrate` prop to opt-in to hydration. We'll use "eager" as an example here. [Jump to the next section](#choose-the-right-hydration-mode) for a full list of hydration modes.

### Hydrate component shortcodes

{% include 'examples/hydrate-component-shortcodes.md' %}

[More on component shortcodes →](/docs/component-shortcodes)

### Hydrate component pages

{% include 'examples/hydrate-component-page.md' %}

[More on component pages →](/docs/component-pages-and-layouts)

## Choose the right hydration mode

Hydration isn't just an on-off switch. Using [Astro's hydration modes](https://docs.astro.build/en/core-concepts/component-hydration/) as a guide, we've added more granular options to choose when your component's JS is loaded. All of these options are available for **shortcodes _and_ component pages**.

### true / "onClientLoad" / "eager"

This mirrors how "traditional" component-based frameworks operate. Components using any of these values will be rendered client-side as soon as possible.

#### Usage

```html
<!-- page-with-shortcode.njk -->
{% raw %}
<body>
  <!--server-render and hydrate client-side-->
  {% component 'Example.jsx', hydrate=true %}
  {% component 'Example.jsx', hydrate='eager' %}
  {% component 'Example.jsx', hydrate='onClientLoad' %}
  <!--don't server-render and *only* render client-side-->
  {% component 'Example.jsx', renderWithoutSSR=true %}
  {% component 'Example.jsx', renderWithoutSSR='eager' %}
  {% component 'Example.jsx', renderWithoutSSR='onClientLoad' %}
</body>
{% endraw %}
```

Whenever you visit `/page-with-shortcode`, we'll import the component library (React in this case) and your `Example.jsx`'s JS bundle as soon as the page is done parsing (see [MDN's docs on scripts with `type="module"`](https://v8.dev/features/modules#browser)). This ensures you component is interactive as soon as possible.

### "onComponentVisible" / "lazy"

Similar to [lazy-loading images](https://developer.mozilla.org/en-US/docs/Web/Performance/Lazy_loading), we only load your component's JS when your component is scrolled into view. This uses the [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API) to figure out whether your component is on the page. Once it is, we quickly grab the necessary dependencies to hydrate your component.

> Note: We **still import Slinkity-specific scripts** ahead of time using [module preloading](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types/modulepreload). Don't worry, it's a very small bundle! We just use this to mount your component once it scrolls into view.

#### Usage

```html
{% raw %}
<body>
  <!--server-render and hydrate client-side-->
  {% component 'Example.jsx', hydrate='onComponentVisible' %}
  {% component 'Example.jsx', hydrate='lazy' %}
  <!--don't server-render and *only* render client-side-->
  {% component 'Example.jsx', renderWithoutSSR='onComponentVisible' %}
  {% component 'Example.jsx', renderWithoutSSR='lazy' %}
</body>
{% endraw %}
```

### "onClientIdle"

Here, we load your component client-side as soon as the browser's main thread has calmed down. This de-prioritizes your component and allows other JS resources on your page to take precedence. This relies on [the `window.requestIdleCallback()` method](https://developer.mozilla.org/en-US/docs/Web/API/Window/requestIdleCallback) in supported browsers, and sets an arbitrary `200ms` timeout for unsupported browsers.

#### Usage

```html
{% raw %}
<body>
  <!--server-render and hydrate client-side-->
  {% component 'Example.jsx', hydrate='onClientIdle' %}
  <!--don't server-render and *only* render client-side-->
  {% component 'Example.jsx', renderWithoutSSR='onClientIdle' %}
</body>
{% endraw %}
```

### "onClientMedia(media_query)"

This helper loads your component client-side when a media query is met. This is helpful for components that only need interactivity at certain screen sizes (ex. a slide-out navigation for mobile devices). This relies on [the `window.matchMedia()` method](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia).

#### Usage

```html
{% raw %}
<body>
  <!--server-render and hydrate client-side-->
  {% component 'SlideOutMenu.vue', hydrate='onClientMedia(screen (max-width: 400px))' %}
  <!--don't server-render and *only* render client-side-->
  {% component 'SlideOutMenu.vue', renderWithoutSSR='onClientMedia(screen (max-width: 400px))' %}
</body>
{% endraw %}
```

> Note: don't forget those extra parens `(...)` when writing your query! You may expect a value like `onClientMedia(max-width: 300px)` to work, but you'll need an extra wrapper for the media query itself: `onClientMedia((max-width: 300px))`.

### "none" - default

This is the default for component pages and shortcodes. Non-hydrated components are rendered to HTML at build time, **but no JavaScript is shipped to the client.** This means no interactivity, no state management, nothing. Use this option if you want to use component languages like React as a templating language alone.